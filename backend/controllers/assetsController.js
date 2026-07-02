import { query } from '../services/db.js';
import { createError } from '../middleware/errorHandler.js';
import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';

const log = logger.child('assetsController');

// Full expanded asset type taxonomy (per design spec)
const VALID_TYPES = [
  'character',      // portraits, expressions, silhouettes, rigs
  'outfit',         // costume variants per character
  'background',     // scene backgrounds, environments
  'prop',           // objects, vehicles, weapons, items
  'location',       // reusable location composites
  'building',       // architectural assets
  'map',            // world/area maps
  'scene',          // composed scene setups
  'animation',      // animation clips, rigs, sequences
  'camera_preset',  // camera angles, framing presets
  'lighting',       // lighting setups, mood presets
  'particle',       // VFX, particle effects
  'material',       // textures, surface materials
  'audio',          // music, SFX, ambient
  'voice',          // character voice clips, TTS
  'panel',          // comic panels
  'style',          // style references, moodboards
];

export async function listAssets(req, res) {
  const { projectId } = req.params;
  const { type, subtype, tag } = req.query;

  let sql = 'SELECT * FROM assets WHERE project_id = $1';
  const params = [projectId];
  let i = 2;

  if (type) { sql += ` AND type = $${i++}`; params.push(type); }
  if (subtype) { sql += ` AND subtype = $${i++}`; params.push(subtype); }
  if (tag) { sql += ` AND $${i++} = ANY(tags)`; params.push(tag); }

  sql += ' ORDER BY usage_count DESC, created_at DESC';

  const result = await query(sql, params);
  res.json({ assets: result.rows, count: result.rows.length });
}

export async function getAsset(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    'SELECT * FROM assets WHERE id = $1 AND project_id = $2',
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Asset not found.');

  // Attach version history
  const versions = await query(
    'SELECT * FROM asset_versions WHERE asset_id = $1 ORDER BY version_number DESC',
    [id]
  );

  res.json({ asset: result.rows[0], versions: versions.rows });
}

export async function createAsset(req, res) {
  const { projectId } = req.params;
  const { name, type, subtype, description, file_url, thumbnail, metadata, tags, source, linked_id } = req.body;

  if (!name) throw createError(400, 'Asset name is required.');
  if (!type) throw createError(400, 'Asset type is required.');
  if (!VALID_TYPES.includes(type)) throw createError(400, `Invalid type "${type}". Valid: ${VALID_TYPES.join(', ')}`);

  const result = await query(
    `INSERT INTO assets
       (project_id, name, type, subtype, description, file_url, thumbnail, metadata, tags, source, linked_id, version_number)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1) RETURNING *`,
    [projectId, name, type, subtype, description, file_url, thumbnail,
     JSON.stringify(metadata ?? {}),
     tags ?? [],
     source ?? 'manual',
     linked_id ?? null]
  );

  const asset = result.rows[0];

  // Create v1 in versions table automatically
  if (file_url || thumbnail) {
    await query(
      `INSERT INTO asset_versions (asset_id, project_id, version_number, file_url, thumbnail, metadata, notes, created_by)
       VALUES ($1,$2,1,$3,$4,$5,'Initial version',$6)`,
      [asset.id, projectId, file_url, thumbnail, JSON.stringify(metadata ?? {}), source ?? 'user']
    );
  }

  eventBus.emit('asset:created', { projectId, asset });
  log.info('Asset created', { id: asset.id, name, type });
  res.status(201).json({ asset });
}

export async function updateAsset(req, res) {
  const { projectId, id } = req.params;
  const { name, subtype, description, file_url, thumbnail, metadata, tags } = req.body;

  const result = await query(
    `UPDATE assets SET
       name = COALESCE($1, name),
       subtype = COALESCE($2, subtype),
       description = COALESCE($3, description),
       file_url = COALESCE($4, file_url),
       thumbnail = COALESCE($5, thumbnail),
       metadata = COALESCE($6, metadata),
       tags = COALESCE($7, tags),
       updated_at = NOW()
     WHERE id = $8 AND project_id = $9 RETURNING *`,
    [name, subtype, description, file_url, thumbnail,
     metadata ? JSON.stringify(metadata) : null,
     tags ?? null, id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Asset not found.');

  eventBus.emit('asset:updated', { projectId, id, changes: req.body });
  res.json({ asset: result.rows[0] });
}

export async function incrementUsage(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    'UPDATE assets SET usage_count = usage_count + 1 WHERE id = $1 AND project_id = $2 RETURNING id, usage_count',
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Asset not found.');
  eventBus.emit('asset:used', { projectId, id });
  res.json({ id, usage_count: result.rows[0].usage_count });
}

export async function deleteAsset(req, res) {
  const { projectId, id } = req.params;
  const result = await query(
    'DELETE FROM assets WHERE id = $1 AND project_id = $2 RETURNING id',
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Asset not found.');
  res.json({ deleted: id });
}

export async function getAssetStats(req, res) {
  const { projectId } = req.params;
  const result = await query(
    `SELECT type, COUNT(*) as count, SUM(usage_count) as total_uses
     FROM assets WHERE project_id = $1 GROUP BY type ORDER BY count DESC`,
    [projectId]
  );
  res.json({ stats: result.rows });
}

// ── Asset Versioning ─────────────────────────────────────────────────────────

export async function listVersions(req, res) {
  const { projectId, id } = req.params;
  // Confirm asset ownership first
  const asset = await query('SELECT id FROM assets WHERE id = $1 AND project_id = $2', [id, projectId]);
  if (!asset.rows.length) throw createError(404, 'Asset not found.');

  const result = await query(
    'SELECT * FROM asset_versions WHERE asset_id = $1 ORDER BY version_number DESC',
    [id]
  );
  res.json({ versions: result.rows });
}

export async function createVersion(req, res) {
  const { projectId, id } = req.params;
  const { file_url, thumbnail, metadata, notes, created_by } = req.body;

  // Confirm asset ownership
  const assetResult = await query(
    'SELECT * FROM assets WHERE id = $1 AND project_id = $2',
    [id, projectId]
  );
  if (!assetResult.rows.length) throw createError(404, 'Asset not found.');
  const asset = assetResult.rows[0];

  const nextVersion = (asset.version_number ?? 1) + 1;

  // Insert new version record
  const versionResult = await query(
    `INSERT INTO asset_versions (asset_id, project_id, version_number, file_url, thumbnail, metadata, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [id, projectId, nextVersion, file_url, thumbnail,
     JSON.stringify(metadata ?? {}), notes ?? '', created_by ?? 'user']
  );

  // Bump version_number on asset and optionally update file_url
  await query(
    `UPDATE assets SET version_number = $1, current_version_id = $2,
       file_url = COALESCE($3, file_url), thumbnail = COALESCE($4, thumbnail), updated_at = NOW()
     WHERE id = $5`,
    [nextVersion, versionResult.rows[0].id, file_url ?? null, thumbnail ?? null, id]
  );

  log.info('Asset version created', { id, version: nextVersion });
  res.status(201).json({ version: versionResult.rows[0] });
}
