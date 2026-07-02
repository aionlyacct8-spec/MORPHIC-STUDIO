/**
 * Scenes & Episodes Controller
 */

import { query } from '../services/db.js';
import { createError } from '../middleware/errorHandler.js';
import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';
import { syncEntityToGraph } from '../services/knowledgeGraphService.js';

const log = logger.child('scenes');

// ── Pagination helper ─────────────────────────────────────────────────────────

function paginate(req) {
  const limit  = Math.min(parseInt(req.query.limit  ?? 50,  10), 200);
  const offset = Math.max(parseInt(req.query.offset ?? 0,   10), 0);
  return { limit, offset };
}

// ── Scenes ────────────────────────────────────────────────────────────────────

export async function listScenes(req, res) {
  const { projectId } = req.params;
  const { limit, offset } = paginate(req);
  const { status, scriptId } = req.query;

  let sql = `SELECT * FROM scenes WHERE project_id = $1 AND deleted_at IS NULL`;
  const params = [projectId];
  let i = 2;

  if (status)   { sql += ` AND status = $${i++}`;     params.push(status); }
  if (scriptId) { sql += ` AND script_id = $${i++}`;  params.push(scriptId); }

  sql += ` ORDER BY scene_number ASC NULLS LAST, created_at ASC LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const res2 = await query(sql, params);
  const count = await query(
    `SELECT COUNT(*) FROM scenes WHERE project_id = $1 AND deleted_at IS NULL`,
    [projectId]
  );

  res.json({ scenes: res2.rows, total: parseInt(count.rows[0].count, 10), limit, offset });
}

export async function getScene(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `SELECT * FROM scenes WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Scene not found.');
  res.json({ scene: result.rows[0] });
}

export async function createScene(req, res) {
  const { projectId } = req.params;
  const {
    title, scene_number, script_id, location_id,
    description, action, characters, mood,
    time_of_day, weather, duration_est, status, metadata,
  } = req.body;

  const result = await query(
    `INSERT INTO scenes
       (project_id, title, scene_number, script_id, location_id,
        description, action, characters, mood, time_of_day, weather,
        duration_est, status, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      projectId, title ?? null, scene_number ?? null, script_id ?? null, location_id ?? null,
      description ?? null, action ?? null,
      characters ? `{${characters.join(',')}}` : '{}',
      mood ?? null, time_of_day ?? null, weather ?? null,
      duration_est ?? null, status ?? 'draft',
      JSON.stringify(metadata ?? {}),
    ]
  );

  const scene = result.rows[0];
  eventBus.emit('scene:created', { projectId, scene });

  // Sync scene to the knowledge graph (non-blocking)
  syncEntityToGraph(projectId, {
    entityId:   scene.id,
    entityType: 'scene',
    label:      scene.title ?? `Scene ${scene.scene_number ?? ''}`.trim(),
    properties: { status: scene.status, mood: scene.mood, time_of_day: scene.time_of_day },
  }).catch(err => log.debug('Scene KG sync skipped', { err: err.message }));

  log.info('Scene created', { id: scene.id, title });
  res.status(201).json({ scene });
}

export async function updateScene(req, res) {
  const { projectId, id } = req.params;
  const fields = req.body;

  const result = await query(
    `UPDATE scenes SET
       title       = COALESCE($1,  title),
       scene_number= COALESCE($2,  scene_number),
       description = COALESCE($3,  description),
       action      = COALESCE($4,  action),
       mood        = COALESCE($5,  mood),
       time_of_day = COALESCE($6,  time_of_day),
       status      = COALESCE($7,  status),
       metadata    = COALESCE($8,  metadata),
       updated_at  = NOW()
     WHERE id = $9 AND project_id = $10 AND deleted_at IS NULL
     RETURNING *`,
    [
      fields.title, fields.scene_number, fields.description,
      fields.action, fields.mood, fields.time_of_day, fields.status,
      fields.metadata ? JSON.stringify(fields.metadata) : null,
      id, projectId,
    ]
  );
  if (!result.rows.length) throw createError(404, 'Scene not found.');
  eventBus.emit('scene:updated', { projectId, id, changes: fields });
  res.json({ scene: result.rows[0] });
}

export async function deleteScene(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE scenes SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Scene not found.');
  eventBus.emit('scene:deleted', { projectId, id });
  res.json({ deleted: id });
}

// ── Episodes ──────────────────────────────────────────────────────────────────

export async function listEpisodes(req, res) {
  const { projectId } = req.params;
  const { limit, offset } = paginate(req);
  const { status } = req.query;

  let sql = `SELECT * FROM episodes WHERE project_id = $1 AND deleted_at IS NULL`;
  const params = [projectId];
  let i = 2;
  if (status) { sql += ` AND status = $${i++}`; params.push(status); }
  sql += ` ORDER BY season_num ASC, episode_num ASC LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const res2 = await query(sql, params);
  const count = await query(
    `SELECT COUNT(*) FROM episodes WHERE project_id = $1 AND deleted_at IS NULL`,
    [projectId]
  );
  res.json({ episodes: res2.rows, total: parseInt(count.rows[0].count, 10), limit, offset });
}

export async function getEpisode(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `SELECT * FROM episodes WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Episode not found.');
  res.json({ episode: result.rows[0] });
}

export async function createEpisode(req, res) {
  const { projectId } = req.params;
  const { title, episode_num, season_num, synopsis, scenes, status, air_date, metadata } = req.body;

  if (!title) throw createError(400, 'Episode title is required.');

  const result = await query(
    `INSERT INTO episodes
       (project_id, title, episode_num, season_num, synopsis, scenes, status, air_date, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      projectId, title, episode_num ?? null, season_num ?? 1,
      synopsis ?? null,
      scenes ? `{${scenes.join(',')}}` : '{}',
      status ?? 'draft',
      air_date ?? null,
      JSON.stringify(metadata ?? {}),
    ]
  );

  const episode = result.rows[0];
  eventBus.emit('episode:created', { projectId, episode });
  res.status(201).json({ episode });
}

export async function updateEpisode(req, res) {
  const { projectId, id } = req.params;
  const fields = req.body;

  const result = await query(
    `UPDATE episodes SET
       title      = COALESCE($1, title),
       synopsis   = COALESCE($2, synopsis),
       status     = COALESCE($3, status),
       air_date   = COALESCE($4, air_date),
       updated_at = NOW()
     WHERE id = $5 AND project_id = $6 AND deleted_at IS NULL
     RETURNING *`,
    [fields.title, fields.synopsis, fields.status, fields.air_date ?? null, id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Episode not found.');
  eventBus.emit('episode:updated', { projectId, id, changes: fields });
  res.json({ episode: result.rows[0] });
}

export async function deleteEpisode(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    `UPDATE episodes SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Episode not found.');
  res.json({ deleted: id });
}
