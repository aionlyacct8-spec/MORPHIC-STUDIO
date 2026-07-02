/**
 * Morphic Studio — AI Orchestrator
 *
 * Responsibilities:
 *  - Route tasks to the correct specialist agent
 *  - Inject Project Brain context into every request
 *  - Coordinate multi-agent workflows
 *  - Track generation jobs in the database
 *  - Manage retries and failures
 *  - Cache frequent responses (in-memory, short TTL)
 *  - Log token usage and estimated costs
 */

import { query } from '../services/db.js';
import { buildContext, appendMemory } from '../services/brainService.js';
import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';

import storyAgent     from './storyAgent.js';
import characterAgent from './characterAgent.js';
import worldAgent     from './worldAgent.js';
import storyboardAgent from './storyboardAgent.js';

const log = logger.child('orchestrator');

// ── Cost estimates (USD per 1K tokens) — updated periodically ────────────────
const COST_PER_1K = {
  'gpt-4o-mini':            { input: 0.00015,  output: 0.0006  },
  'gpt-4o':                 { input: 0.005,    output: 0.015   },
  'openai/gpt-4o-mini':     { input: 0.00015,  output: 0.0006  },
  'openai/gpt-4o':          { input: 0.005,    output: 0.015   },
  'anthropic/claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'google/gemini-flash-1.5': { input: 0.000075, output: 0.0003 },
  default:                  { input: 0.001,    output: 0.003   },
};

function estimateCost(model, usage) {
  if (!usage) return null;
  const rates = COST_PER_1K[model] ?? COST_PER_1K.default;
  const inputTokens  = usage.prompt_tokens     ?? 0;
  const outputTokens = usage.completion_tokens ?? 0;
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}

// ── In-memory response cache (TTL: 5 minutes) ────────────────────────────────
const _cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function _cacheKey(agentType, projectId, inputHash) {
  return `${agentType}:${projectId}:${inputHash}`;
}

function _hash(obj) {
  const str = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function _fromCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return entry.value;
}

function _toCache(key, value) {
  _cache.set(key, { value, ts: Date.now() });
}

// ── Job management ────────────────────────────────────────────────────────────

async function _createJob(projectId, jobType, agent, input) {
  try {
    const res = await query(
      `INSERT INTO generation_jobs (project_id, job_type, agent, status, input, started_at)
       VALUES ($1, $2, $3, 'running', $4, NOW()) RETURNING id`,
      [projectId, jobType, agent, JSON.stringify(input)]
    );
    return res.rows[0]?.id ?? null;
  } catch (err) {
    log.warn('Could not create generation job (DB may not be ready)', { err: err.message });
    return null;
  }
}

async function _completeJob(jobId, { output, provider, model, usage, durationMs }) {
  if (!jobId) return;
  const cost = estimateCost(model, usage);
  try {
    await query(
      `UPDATE generation_jobs SET
         status = 'complete', output = $1, provider = $2, model = $3,
         tokens_used = $4, cost_usd = $5, duration_ms = $6, completed_at = NOW()
       WHERE id = $7`,
      [
        JSON.stringify(output ?? {}),
        provider ?? null,
        model ?? null,
        usage?.total_tokens ?? 0,
        cost ?? null,
        durationMs,
        jobId,
      ]
    );
  } catch (err) {
    log.warn('Could not update generation job', { jobId, err: err.message });
  }
}

async function _failJob(jobId, errorMessage) {
  if (!jobId) return;
  try {
    await query(
      `UPDATE generation_jobs SET status = 'failed', error = $1, completed_at = NOW() WHERE id = $2`,
      [errorMessage, jobId]
    );
  } catch (_) { /* non-critical */ }
}

// ── Agent registry ────────────────────────────────────────────────────────────

const AGENTS = {
  story:      storyAgent,
  character:  characterAgent,
  world:      worldAgent,
  storyboard: storyboardAgent,
};

/**
 * Resolves the best agent for a given task type.
 * task types: analyze_script | generate_outline | expand_scene |
 *             generate_character_dna | evolve_character | suggest_relationships |
 *             generate_world_bible | generate_location | build_timeline |
 *             generate_panels | refine_panels
 */
function _resolveAgent(taskType) {
  const map = {
    analyze_script:          'story',
    generate_outline:        'story',
    expand_scene:            'story',
    generate_character_dna:  'character',
    evolve_character:        'character',
    suggest_relationships:   'character',
    generate_world_bible:    'world',
    generate_location:       'world',
    build_timeline:          'world',
    generate_panels:         'storyboard',
    refine_panels:           'storyboard',
  };
  const name = map[taskType];
  if (!name) throw new Error(`Unknown task type: "${taskType}"`);
  return { agentName: name, agent: AGENTS[name] };
}

// ── Public: dispatch a single task ───────────────────────────────────────────

/**
 * dispatch({ projectId, taskType, input, useCache, forceFresh })
 *
 * Returns { result, jobId, agentName, fromCache, durationMs }
 */
export async function dispatch({ projectId, taskType, input = {}, useCache = true, forceFresh = false }) {
  const { agentName, agent } = _resolveAgent(taskType);

  // Inject Project Brain context automatically
  let brainContext = '';
  try {
    brainContext = await buildContext(projectId);
  } catch (err) {
    log.warn('Brain context unavailable', { projectId, err: err.message });
  }

  const enrichedInput = { ...input, brainContext };

  // Check cache
  if (useCache && !forceFresh) {
    const key = _cacheKey(agentName, projectId, _hash(enrichedInput));
    const cached = _fromCache(key);
    if (cached) {
      log.info(`Cache hit for ${taskType}`, { projectId });
      return { result: cached, jobId: null, agentName, fromCache: true, durationMs: 0 };
    }
  }

  const jobId = await _createJob(projectId, taskType, agentName, input);
  const startMs = Date.now();

  try {
    log.info(`Dispatching ${taskType} → ${agentName}`, { projectId });

    // Call the correct method on the agent
    // Method name map: task type → actual export name on the agent module
    const METHOD_MAP = {
      analyze_script:         'analyzeScript',
      generate_outline:       'generateOutline',
      expand_scene:           'expandScene',
      generate_character_dna: 'generateDNA',        // characterAgent exports generateDNA
      evolve_character:       'evolveCharacter',
      suggest_relationships:  'suggestRelationships',
      generate_world_bible:   'generateWorldBible',
      generate_location:      'generateLocation',
      build_timeline:         'buildTimeline',
      generate_panels:        'generatePanels',
      refine_panels:          'refinePanels',
    };

    const methodName = METHOD_MAP[taskType];
    if (!methodName) throw new Error(`Unknown task type: "${taskType}"`);

    const agentFn = agent[methodName];
    if (typeof agentFn !== 'function') {
      throw new Error(`Agent "${agentName}" does not export method "${methodName}" (task: "${taskType}")`);
    }

    const result = await agentFn(enrichedInput);
    const durationMs = Date.now() - startMs;

    // Store job result
    await _completeJob(jobId, {
      output: result,
      provider: result?._meta?.provider,
      model: result?._meta?.model,
      usage: result?._meta?.usage,
      durationMs,
    });

    // Cache successful result
    if (useCache) {
      const key = _cacheKey(agentName, projectId, _hash(enrichedInput));
      _toCache(key, result);
    }

    // Auto-append memory if agent signals importance
    if (result?._memory) {
      for (const mem of result._memory) {
        await appendMemory(projectId, mem).catch(() => {});
      }
    }

    eventBus.emit('ai:completed', { projectId, taskType, agentName, durationMs, jobId });

    return { result, jobId, agentName, fromCache: false, durationMs };

  } catch (err) {
    const durationMs = Date.now() - startMs;
    log.error(`${taskType} failed via ${agentName}`, { projectId, err: err.message });
    await _failJob(jobId, err.message);
    eventBus.emit('ai:failed', { projectId, taskType, agentName, error: err.message, jobId });
    throw err;
  }
}

/**
 * dispatchParallel(tasks[]) — run multiple independent tasks simultaneously.
 * Each task: { projectId, taskType, input }
 * Returns array of settled results (same order as input).
 */
export async function dispatchParallel(tasks) {
  const promises = tasks.map(t => dispatch(t).catch(err => ({ error: err.message })));
  return Promise.all(promises);
}

/**
 * getJobStats(projectId) — summary of generation activity for a project.
 */
export async function getJobStats(projectId) {
  try {
    const res = await query(
      `SELECT
         job_type,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'complete')  AS completed,
         COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
         SUM(tokens_used)   AS total_tokens,
         SUM(cost_usd)      AS total_cost_usd,
         AVG(duration_ms)   AS avg_duration_ms
       FROM generation_jobs
       WHERE project_id = $1
       GROUP BY job_type
       ORDER BY total DESC`,
      [projectId]
    );
    return res.rows;
  } catch {
    return [];
  }
}

export default { dispatch, dispatchParallel, getJobStats };
