import { query } from '../services/db.js';
import { buildContext, appendMemory } from '../services/brainService.js';
import { analyzeScript, generateOutline } from '../agents/storyAgent.js';
import { generatePanels } from '../agents/storyboardAgent.js';
import { createError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const log = logger.child('storiesController');

// ── Scripts ──────────────────────────────────────────────

export async function listScripts(req, res) {
  const { projectId } = req.params;
  const result = await query(
    'SELECT id, title, status, word_count, created_at, updated_at FROM scripts WHERE project_id = $1 ORDER BY updated_at DESC',
    [projectId]
  );
  res.json({ scripts: result.rows });
}

export async function getScript(req, res) {
  const { projectId, scriptId } = req.params;
  const scriptResult = await query(
    'SELECT * FROM scripts WHERE id = $1 AND project_id = $2',
    [scriptId, projectId]
  );
  if (!scriptResult.rows.length) throw createError(404, 'Script not found.');

  const storyboards = await query(
    'SELECT * FROM storyboards WHERE script_id = $1 ORDER BY created_at DESC LIMIT 5',
    [scriptId]
  );

  res.json({ script: scriptResult.rows[0], storyboards: storyboards.rows });
}

export async function createScript(req, res) {
  const { projectId } = req.params;
  const { title, content, status } = req.body;
  if (!title) throw createError(400, 'Script title is required.');

  const wordCount = content ? content.trim().split(/\s+/).length : 0;

  const result = await query(
    `INSERT INTO scripts (project_id, title, content, status, word_count)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [projectId, title, content ?? '', status ?? 'draft', wordCount]
  );

  log.info('Script created', { id: result.rows[0].id, title });
  res.status(201).json({ script: result.rows[0] });
}

export async function updateScript(req, res) {
  const { projectId, scriptId } = req.params;
  const { title, content, status } = req.body;

  const wordCount = content ? content.trim().split(/\s+/).length : undefined;

  const result = await query(
    `UPDATE scripts SET
       title = COALESCE($1, title),
       content = COALESCE($2, content),
       status = COALESCE($3, status),
       word_count = COALESCE($4, word_count),
       updated_at = NOW()
     WHERE id = $5 AND project_id = $6 RETURNING *`,
    [title, content, status, wordCount, scriptId, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Script not found.');
  res.json({ script: result.rows[0] });
}

// ── AI Actions ────────────────────────────────────────────

/**
 * POST /api/stories/:projectId/scripts/:scriptId/analyze
 * Analyzes a script with the Story Agent and generates storyboard panels.
 */
export async function analyzeScriptHandler(req, res) {
  const { projectId, scriptId } = req.params;

  const scriptResult = await query(
    'SELECT * FROM scripts WHERE id = $1 AND project_id = $2',
    [scriptId, projectId]
  );
  if (!scriptResult.rows.length) throw createError(404, 'Script not found.');
  const script = scriptResult.rows[0];

  if (!script.content) throw createError(400, 'Script has no content to analyze.');

  log.info('Analyzing script via Story Agent', { scriptId, title: script.title });

  const brainContext = await buildContext(projectId);
  const analysis = await analyzeScript({ title: script.title, scriptText: script.content, brainContext });

  // Enrich panels via Storyboard Agent
  const characters = await query('SELECT * FROM characters WHERE project_id = $1', [projectId]);
  const world = await query('SELECT * FROM worlds WHERE project_id = $1 LIMIT 1', [projectId]);
  const proj = await query('SELECT style FROM projects WHERE id = $1', [projectId]);

  const enriched = await generatePanels({
    panels: analysis.panels,
    characters: characters.rows,
    world: world.rows[0] ?? {},
    style: proj.rows[0]?.style ?? '',
    brainContext,
  });

  // Save storyboard
  const sbResult = await query(
    `INSERT INTO storyboards (script_id, project_id, panel_data, agent_context)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [scriptId, projectId,
     JSON.stringify(enriched.panels),
     JSON.stringify({ brainContext: brainContext.slice(0, 500), analysis_summary: analysis.summary })]
  );

  // Write memory
  await appendMemory(projectId, {
    agentType: 'story', memoryType: 'decision',
    content: `Script "${script.title}" analyzed. Summary: ${analysis.summary}`,
    importance: 7,
    refs: [{ entity_type: 'script', entity_id: scriptId, label: script.title }],
  });

  res.json({
    storyboard: sbResult.rows[0],
    panels: enriched.panels,
    production_notes: enriched.production_notes,
    analysis_summary: analysis.summary,
    themes: analysis.themes,
  });
}

/**
 * POST /api/stories/:projectId/outline
 * Generate a full story outline from a premise.
 */
export async function generateOutlineHandler(req, res) {
  const { projectId } = req.params;
  const { premise, genre, tone, acts } = req.body;
  if (!premise) throw createError(400, '"premise" is required.');

  const brainContext = await buildContext(projectId);
  const outline = await generateOutline({ premise, genre, tone, acts: acts ?? 3, brainContext });

  await appendMemory(projectId, {
    agentType: 'story', memoryType: 'decision',
    content: `Outline generated. Logline: ${outline.logline ?? premise}`,
    importance: 8,
  });

  res.json({ outline });
}
