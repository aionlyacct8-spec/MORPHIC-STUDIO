/**
 * Brain Service — read, write, and build context for the Project Brain.
 * Every AI agent call should pass brainContext from buildContext().
 */
import { query } from './db.js';
import logger from '../utils/logger.js';

const log = logger.child('brainService');

/**
 * getBrain(projectId) — fetch the full project brain record.
 * Creates one if it doesn't exist yet.
 */
export async function getBrain(projectId) {
  const result = await query(
    'SELECT * FROM project_brain WHERE project_id = $1',
    [projectId]
  );

  if (result.rows.length > 0) return result.rows[0];

  // Auto-create an empty brain for the project
  const created = await query(
    `INSERT INTO project_brain (project_id) VALUES ($1) RETURNING *`,
    [projectId]
  );
  log.info('Created new project brain', { projectId });
  return created.rows[0];
}

/**
 * updateSection(projectId, section, data)
 * Updates one named section of the brain (story_bible, world_bible, etc.)
 */
export async function updateSection(projectId, section, data) {
  const VALID_SECTIONS = [
    'story_bible', 'character_bible', 'world_bible',
    'timeline', 'continuity_rules', 'voice_profiles', 'style_guide', 'art_direction',
  ];
  if (!VALID_SECTIONS.includes(section)) {
    throw new Error(`Invalid brain section: "${section}". Valid: ${VALID_SECTIONS.join(', ')}`);
  }

  // Merge with existing data rather than overwrite
  const brain = await getBrain(projectId);
  const existing = brain[section] ?? (Array.isArray(data) ? [] : {});
  const merged = Array.isArray(data)
    ? [...existing, ...data]
    : { ...existing, ...data };

  await query(
    `UPDATE project_brain SET ${section} = $1, updated_at = NOW() WHERE project_id = $2`,
    [JSON.stringify(merged), projectId]
  );

  // Regenerate the compressed memory context
  await rebuildContext(projectId);

  log.info('Brain section updated', { projectId, section });
  return merged;
}

/**
 * setBrainSection(projectId, section, data) — full replace (not merge)
 */
export async function setBrainSection(projectId, section, data) {
  const VALID_SECTIONS = [
    'story_bible', 'character_bible', 'world_bible',
    'timeline', 'continuity_rules', 'voice_profiles', 'style_guide', 'art_direction',
  ];
  if (!VALID_SECTIONS.includes(section)) {
    throw new Error(`Invalid brain section: "${section}"`);
  }

  await getBrain(projectId); // ensure brain exists
  await query(
    `UPDATE project_brain SET ${section} = $1, updated_at = NOW() WHERE project_id = $2`,
    [JSON.stringify(data), projectId]
  );
  await rebuildContext(projectId);
  return data;
}

/**
 * appendMemory(projectId, agentType, memoryType, content, importance, refs)
 * Logs a memory fact from an agent so it persists across sessions.
 */
export async function appendMemory(projectId, { agentType, memoryType, content, importance = 5, refs = [] }) {
  await query(
    `INSERT INTO ai_memory (project_id, agent_type, memory_type, content, importance, refs)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, agentType, memoryType, content, importance, JSON.stringify(refs)]
  );
  log.info('Memory appended', { projectId, agentType, memoryType });
}

/**
 * getMemory(projectId, { agentType, limit, minImportance })
 * Retrieves stored AI memories for a project.
 */
export async function getMemory(projectId, { agentType, limit = 50, minImportance = 1 } = {}) {
  let sql = `SELECT * FROM ai_memory WHERE project_id = $1 AND importance >= $2`;
  const params = [projectId, minImportance];

  if (agentType) {
    sql += ` AND agent_type = $3`;
    params.push(agentType);
  }

  sql += ` ORDER BY importance DESC, created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * buildContext(projectId) — returns a compressed text string injected into every AI call.
 */
export async function buildContext(projectId) {
  const brain = await getBrain(projectId);
  if (brain.memory_context) return brain.memory_context;
  return await rebuildContext(projectId);
}

/**
 * rebuildContext(projectId) — re-generates and saves memory_context from brain sections.
 */
async function rebuildContext(projectId) {
  const brain = await getBrain(projectId);

  const parts = [];

  const sb = brain.story_bible;
  if (sb && Object.keys(sb).length) {
    parts.push(`STORY: ${sb.premise ?? ''} Themes: ${(sb.themes ?? []).join(', ')}. Tone: ${sb.tone ?? ''}.`);
  }

  const wb = brain.world_bible;
  if (wb && Object.keys(wb).length) {
    parts.push(`WORLD: ${wb.name ?? ''} (${wb.era ?? ''}). ${wb.description ?? ''}`);
  }

  const cb = brain.character_bible;
  if (cb && Object.keys(cb).length) {
    const names = Object.keys(cb).join(', ');
    parts.push(`CHARACTERS: ${names}.`);
  }

  const rules = brain.continuity_rules;
  if (Array.isArray(rules) && rules.length) {
    parts.push(`CONTINUITY RULES: ${rules.map(r => typeof r === 'string' ? r : r.rule).join('; ')}`);
  }

  // Art direction summary
  const ad = brain.art_direction;
  if (ad && Object.keys(ad).length) {
    const adParts = [];
    if (ad.style) adParts.push(`Style: ${ad.style}`);
    if (ad.palette) adParts.push(`Palette: ${ad.palette}`);
    if (ad.line_style) adParts.push(`Lines: ${ad.line_style}`);
    if (ad.rendering) adParts.push(`Rendering: ${ad.rendering}`);
    if (adParts.length) parts.push(`ART DIRECTION: ${adParts.join('. ')}.`);
  }

  const context = parts.join('\n');

  await query(
    `UPDATE project_brain SET memory_context = $1, updated_at = NOW() WHERE project_id = $2`,
    [context, projectId]
  );

  return context;
}

export default { getBrain, updateSection, setBrainSection, appendMemory, getMemory, buildContext };
