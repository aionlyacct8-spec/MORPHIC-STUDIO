/**
 * Brain Service — read, write, and build context for the Project Brain.
 *
 * Features:
 *  - getBrain / updateSection / setBrainSection / appendMemory / getMemory
 *  - buildContext — compressed string injected into every AI call
 *  - rebuildContext — regenerates from all brain sections
 *  - brain locking (prevents concurrent writes during AI generation)
 *  - version history (every write snapshots the brain)
 *  - memory expiration (prune low-importance old memories)
 *  - searchMemory (keyword search over stored memories)
 */

import { query } from './db.js';
import eventBus from './eventBus.js';
import logger from '../utils/logger.js';

const log = logger.child('brainService');

// ── Section whitelist ─────────────────────────────────────────────────────────

const VALID_SECTIONS = [
  'story_bible', 'character_bible', 'world_bible',
  'timeline', 'continuity_rules', 'voice_profiles',
  'style_guide', 'art_direction', 'lore', 'notes',
  'generation_history', 'relationships_map',
];

// ── Core: get / create ────────────────────────────────────────────────────────

/**
 * getBrain(projectId) — fetch the full project brain record.
 * Auto-creates one if it doesn't exist yet.
 */
export async function getBrain(projectId) {
  const result = await query(
    'SELECT * FROM project_brain WHERE project_id = $1',
    [projectId]
  );

  if (result.rows.length > 0) return result.rows[0];

  const created = await query(
    `INSERT INTO project_brain (project_id) VALUES ($1) RETURNING *`,
    [projectId]
  );
  log.info('Created new project brain', { projectId });
  return created.rows[0];
}

// ── Brain locking ─────────────────────────────────────────────────────────────

/**
 * lockBrain(projectId, reason) — prevent concurrent writes.
 * Agents should lock the brain before long AI operations.
 */
export async function lockBrain(projectId, reason = 'AI generation in progress') {
  await getBrain(projectId); // ensure exists
  await query(
    `UPDATE project_brain SET is_locked = TRUE, lock_reason = $1 WHERE project_id = $2`,
    [reason, projectId]
  );
  eventBus.emit('brain:locked', { projectId, reason });
  log.info('Brain locked', { projectId, reason });
}

/**
 * unlockBrain(projectId) — release the lock.
 */
export async function unlockBrain(projectId) {
  await query(
    `UPDATE project_brain SET is_locked = FALSE, lock_reason = NULL WHERE project_id = $1`,
    [projectId]
  );
  eventBus.emit('brain:unlocked', { projectId });
  log.info('Brain unlocked', { projectId });
}

/**
 * assertUnlocked(projectId) — throws 409 if brain is locked.
 */
export async function assertUnlocked(projectId) {
  const brain = await getBrain(projectId);
  if (brain.is_locked) {
    const err = new Error(`Project Brain is locked: ${brain.lock_reason}`);
    err.status = 409;
    throw err;
  }
}

// ── Version history ───────────────────────────────────────────────────────────

/**
 * saveVersion(projectId, brain, note) — snapshot the brain for history.
 */
async function saveVersion(projectId, brain, note = 'Auto-save') {
  try {
    // Get next version number
    const res = await query(
      `SELECT COALESCE(MAX(version_num), 0) + 1 AS next FROM brain_versions WHERE project_id = $1`,
      [projectId]
    );
    const versionNum = res.rows[0].next;

    const snapshot = {
      story_bible:     brain.story_bible,
      character_bible: brain.character_bible,
      world_bible:     brain.world_bible,
      timeline:        brain.timeline,
      continuity_rules: brain.continuity_rules,
      voice_profiles:  brain.voice_profiles,
      style_guide:     brain.style_guide,
      art_direction:   brain.art_direction,
      lore:            brain.lore,
      notes:           brain.notes,
    };

    await query(
      `INSERT INTO brain_versions (project_id, version_num, snapshot, change_note)
       VALUES ($1, $2, $3, $4)`,
      [projectId, versionNum, JSON.stringify(snapshot), note]
    );

    // Also bump current_version on the brain
    await query(
      `UPDATE project_brain SET current_version = $1 WHERE project_id = $2`,
      [versionNum, projectId]
    );

    eventBus.emit('brain:version_saved', { projectId, versionNum });
    return versionNum;
  } catch (err) {
    log.warn('Could not save brain version (table may not exist yet)', { err: err.message });
    return null;
  }
}

/**
 * getBrainVersions(projectId) — list all saved versions, newest first.
 */
export async function getBrainVersions(projectId, limit = 20) {
  try {
    const res = await query(
      `SELECT id, project_id, version_num, changed_by, change_note, created_at
       FROM brain_versions WHERE project_id = $1
       ORDER BY version_num DESC LIMIT $2`,
      [projectId, limit]
    );
    return res.rows;
  } catch {
    return [];
  }
}

/**
 * restoreBrainVersion(projectId, versionNum) — restore a historical snapshot.
 */
export async function restoreBrainVersion(projectId, versionNum) {
  const res = await query(
    `SELECT snapshot FROM brain_versions WHERE project_id = $1 AND version_num = $2`,
    [projectId, versionNum]
  );
  if (!res.rows.length) {
    const err = new Error(`Brain version ${versionNum} not found.`);
    err.status = 404;
    throw err;
  }

  const snapshot = res.rows[0].snapshot;

  // Build SET clause for all sections present in snapshot
  const setClauses = Object.keys(snapshot).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [projectId, ...Object.values(snapshot).map(v => JSON.stringify(v))];

  await query(
    `UPDATE project_brain SET ${setClauses}, updated_at = NOW() WHERE project_id = $1`,
    values
  );

  await rebuildContext(projectId);
  log.info('Brain restored to version', { projectId, versionNum });
  return { restoredVersion: versionNum };
}

// ── Section write operations ──────────────────────────────────────────────────

/**
 * updateSection(projectId, section, data) — merge new data into a section.
 */
export async function updateSection(projectId, section, data, { note, skipVersionSave = false } = {}) {
  if (!VALID_SECTIONS.includes(section)) {
    throw new Error(`Invalid brain section: "${section}". Valid: ${VALID_SECTIONS.join(', ')}`);
  }

  const brain = await getBrain(projectId);
  const existing = brain[section] ?? (Array.isArray(data) ? [] : {});
  const merged = Array.isArray(data)
    ? [...existing, ...data]
    : { ...existing, ...data };

  await query(
    `UPDATE project_brain SET ${section} = $1, updated_at = NOW() WHERE project_id = $2`,
    [JSON.stringify(merged), projectId]
  );

  if (!skipVersionSave) {
    const updated = await getBrain(projectId);
    await saveVersion(projectId, updated, note ?? `Updated ${section}`);
  }

  await rebuildContext(projectId);
  eventBus.emit('brain:updated', { projectId, section });
  log.info('Brain section updated', { projectId, section });
  return merged;
}

/**
 * setBrainSection(projectId, section, data) — full replace (not merge).
 */
export async function setBrainSection(projectId, section, data, { note } = {}) {
  if (!VALID_SECTIONS.includes(section)) {
    throw new Error(`Invalid brain section: "${section}"`);
  }

  await getBrain(projectId); // ensure exists
  await query(
    `UPDATE project_brain SET ${section} = $1, updated_at = NOW() WHERE project_id = $2`,
    [JSON.stringify(data), projectId]
  );

  const updated = await getBrain(projectId);
  await saveVersion(projectId, updated, note ?? `Set ${section}`);
  await rebuildContext(projectId);
  eventBus.emit('brain:updated', { projectId, section });
  return data;
}

// ── Memory ────────────────────────────────────────────────────────────────────

/**
 * appendMemory — log a fact from an agent so it persists across sessions.
 */
export async function appendMemory(projectId, { agentType, memoryType, content, importance = 5, refs = [] }) {
  await query(
    `INSERT INTO ai_memory (project_id, agent_type, memory_type, content, importance, refs)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, agentType, memoryType, content, importance, JSON.stringify(refs)]
  );
  eventBus.emit('memory:appended', { projectId, agentType, memoryType });
  log.info('Memory appended', { projectId, agentType, memoryType });
}

/**
 * getMemory — retrieve stored AI memories for a project.
 */
export async function getMemory(projectId, { agentType, limit = 50, minImportance = 1, offset = 0 } = {}) {
  let sql = `SELECT * FROM ai_memory WHERE project_id = $1 AND importance >= $2`;
  const params = [projectId, minImportance];

  if (agentType) {
    sql += ` AND agent_type = $3`;
    params.push(agentType);
  }

  sql += ` ORDER BY importance DESC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * searchMemory — keyword search over memory content.
 */
export async function searchMemory(projectId, searchTerm, { limit = 20 } = {}) {
  const res = await query(
    `SELECT * FROM ai_memory
     WHERE project_id = $1 AND content ILIKE $2
     ORDER BY importance DESC, created_at DESC LIMIT $3`,
    [projectId, `%${searchTerm}%`, limit]
  );
  return res.rows;
}

/**
 * expireMemory — prune old low-importance memories to keep context lean.
 * By default: remove importance ≤ 3 memories older than 30 days.
 */
export async function expireMemory(projectId, { maxImportance = 3, olderThanDays = 30 } = {}) {
  const res = await query(
    `DELETE FROM ai_memory
     WHERE project_id = $1
       AND importance <= $2
       AND created_at < NOW() - INTERVAL '1 day' * $3
     RETURNING id`,
    [projectId, maxImportance, olderThanDays]
  );
  const count = res.rows.length;
  if (count > 0) {
    eventBus.emit('memory:expired', { projectId, count });
    log.info('Memories expired', { projectId, count });
  }
  return count;
}

// ── Context building ──────────────────────────────────────────────────────────

/**
 * buildContext(projectId) — returns compressed text injected into every AI call.
 * Uses cached memory_context if fresh; otherwise rebuilds.
 */
export async function buildContext(projectId) {
  const brain = await getBrain(projectId);
  if (brain.memory_context) return brain.memory_context;
  return rebuildContext(projectId);
}

/**
 * rebuildContext(projectId) — regenerates + saves the compressed memory_context.
 *
 * Compression strategy:
 *  1. Extract key facts from each bible section
 *  2. Append top-importance memories
 *  3. Cap at ~4000 chars to stay within token budgets
 */
export async function rebuildContext(projectId) {
  const brain = await getBrain(projectId);
  const parts  = [];

  // Story Bible
  const sb = brain.story_bible;
  if (sb && Object.keys(sb).length) {
    const themesStr  = (sb.themes  ?? []).join(', ');
    const actsStr    = (sb.acts    ?? []).slice(0, 3).map(a => a.title ?? a).join(' → ');
    parts.push(
      `STORY: ${sb.premise ?? ''}` +
      (themesStr ? ` Themes: ${themesStr}.` : '') +
      (sb.tone   ? ` Tone: ${sb.tone}.`     : '') +
      (actsStr   ? ` Arc: ${actsStr}.`      : '')
    );
  }

  // World Bible
  const wb = brain.world_bible;
  if (wb && Object.keys(wb).length) {
    parts.push(
      `WORLD: ${wb.name ?? ''}` +
      (wb.era         ? ` (${wb.era})` : '') +
      (wb.description ? `. ${wb.description.slice(0, 200)}` : '')
    );
  }

  // Character Bible — names only for brevity
  const cb = brain.character_bible;
  if (cb && Object.keys(cb).length) {
    const summaries = Object.entries(cb).slice(0, 8).map(([name, info]) => {
      const role = typeof info === 'object' ? (info.role ?? '') : '';
      return role ? `${name} (${role})` : name;
    });
    parts.push(`CHARACTERS: ${summaries.join(', ')}.`);
  }

  // Continuity Rules — top 5
  const rules = brain.continuity_rules;
  if (Array.isArray(rules) && rules.length) {
    const top = rules.slice(0, 5).map(r => typeof r === 'string' ? r : r.rule);
    parts.push(`CONTINUITY: ${top.join('; ')}`);
  }

  // Art Direction
  const ad = brain.art_direction;
  if (ad && Object.keys(ad).length) {
    const adParts = [];
    if (ad.style)      adParts.push(`Style: ${ad.style}`);
    if (ad.palette)    adParts.push(`Palette: ${ad.palette}`);
    if (ad.line_style) adParts.push(`Lines: ${ad.line_style}`);
    if (ad.rendering)  adParts.push(`Rendering: ${ad.rendering}`);
    if (adParts.length) parts.push(`ART: ${adParts.join('. ')}.`);
  }

  // Lore summary
  const lore = brain.lore;
  if (lore && Object.keys(lore).length) {
    const loreText = typeof lore === 'string' ? lore : JSON.stringify(lore).slice(0, 300);
    parts.push(`LORE: ${loreText}`);
  }

  // Top memories (importance ≥ 7)
  try {
    const memories = await getMemory(projectId, { minImportance: 7, limit: 5 });
    if (memories.length) {
      parts.push(`KEY FACTS: ${memories.map(m => m.content).join(' | ')}`);
    }
  } catch { /* non-critical */ }

  // Compress to ~4000 chars
  let context = parts.join('\n');
  if (context.length > 4000) {
    context = context.slice(0, 3900) + '…';
  }

  await query(
    `UPDATE project_brain SET memory_context = $1, updated_at = NOW() WHERE project_id = $2`,
    [context, projectId]
  );

  const ctxLen = context.length;
  eventBus.emit('brain:rebuilt', { projectId, contextLength: ctxLen });
  log.info('Brain context rebuilt', { projectId, chars: ctxLen });

  return context;
}

export default {
  getBrain,
  lockBrain, unlockBrain, assertUnlocked,
  getBrainVersions, restoreBrainVersion, saveVersion,
  updateSection, setBrainSection,
  appendMemory, getMemory, searchMemory, expireMemory,
  buildContext, rebuildContext,
};
