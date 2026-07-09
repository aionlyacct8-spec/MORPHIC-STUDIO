import { query } from '../services/db.js';

export const PHASE2_TABLES = {
  characterAssetLinks: {
    table: 'character_asset_links',
    collection: 'assetLinks',
    required: ['character_id', 'asset_id', 'link_type'],
    insert: ['project_id', 'character_id', 'asset_id', 'asset_version_id', 'link_type', 'label', 'metadata', 'is_primary'],
    json: ['metadata'],
    orderBy: 'created_at DESC',
  },
  characterRigs: {
    table: 'character_rigs',
    collection: 'rigs',
    required: ['character_id', 'name'],
    insert: ['project_id', 'character_id', 'asset_id', 'asset_version_id', 'name', 'rig_type', 'rig_data', 'compatibility', 'status'],
    json: ['rig_data', 'compatibility'],
    orderBy: 'created_at DESC',
  },
  characterExpressions: {
    table: 'character_expressions',
    collection: 'expressions',
    required: ['character_id', 'name'],
    insert: ['project_id', 'character_id', 'asset_id', 'asset_version_id', 'name', 'emotion', 'intensity', 'expression_data', 'metadata', 'status'],
    json: ['expression_data', 'metadata'],
    orderBy: 'created_at DESC',
  },
  characterPoses: {
    table: 'character_poses',
    collection: 'poses',
    required: ['character_id', 'name'],
    insert: ['project_id', 'character_id', 'rig_id', 'asset_id', 'asset_version_id', 'name', 'pose_type', 'pose_data', 'metadata', 'status'],
    json: ['pose_data', 'metadata'],
    orderBy: 'created_at DESC',
  },
  characterClothingSets: {
    table: 'character_clothing_sets',
    collection: 'clothingSets',
    required: ['character_id', 'name'],
    insert: ['project_id', 'character_id', 'asset_id', 'asset_version_id', 'name', 'clothing_data', 'metadata', 'status'],
    json: ['clothing_data', 'metadata'],
    orderBy: 'created_at DESC',
  },
  scenePlacements: {
    table: 'scene_asset_placements',
    collection: 'placements',
    required: ['scene_id', 'asset_id', 'placement_type'],
    insert: ['project_id', 'scene_id', 'asset_id', 'asset_version_id', 'character_id', 'placement_type', 'transform', 'layer_order', 'timing', 'metadata', 'status'],
    json: ['transform', 'timing', 'metadata'],
    orderBy: 'layer_order ASC, created_at ASC',
  },
  storyboardAssetReferences: {
    table: 'storyboard_asset_references',
    collection: 'assetReferences',
    required: ['asset_id', 'reference_role'],
    insert: ['project_id', 'storyboard_id', 'page_id', 'panel_id', 'scene_id', 'asset_id', 'asset_version_id', 'reference_role', 'camera_data', 'continuity_notes', 'metadata'],
    json: ['camera_data', 'metadata'],
    orderBy: 'created_at DESC',
  },
  comicSpeechBubbles: {
    table: 'comic_speech_bubbles',
    collection: 'speechBubbles',
    required: ['text_content'],
    insert: ['project_id', 'page_id', 'panel_id', 'character_id', 'bubble_type', 'text_content', 'reading_order', 'geometry', 'style', 'metadata', 'status'],
    json: ['geometry', 'style', 'metadata'],
    orderBy: 'reading_order ASC, created_at ASC',
  },
  animationTimelines: {
    table: 'animation_timelines',
    collection: 'timelines',
    required: ['name'],
    insert: ['project_id', 'scene_id', 'name', 'duration_seconds', 'frame_rate', 'timeline_data', 'metadata', 'status'],
    json: ['timeline_data', 'metadata'],
    orderBy: 'created_at DESC',
  },
  animationKeyframes: {
    table: 'animation_keyframes',
    collection: 'keyframes',
    required: ['timeline_id', 'track_type', 'frame_number'],
    insert: ['project_id', 'timeline_id', 'asset_id', 'character_id', 'rig_id', 'track_type', 'frame_number', 'time_seconds', 'keyframe_data', 'interpolation', 'metadata'],
    json: ['keyframe_data', 'metadata'],
    orderBy: 'frame_number ASC, created_at ASC',
  },
};

function stringifyValue(config, field, value) {
  if (config.json?.includes(field)) return JSON.stringify(value ?? {});
  return value ?? null;
}

export async function listPhase2Records(configKey, projectId, filters = {}) {
  const config = PHASE2_TABLES[configKey];
  const limit = Math.min(parseInt(filters.limit ?? 50, 10), 200);
  const offset = Math.max(parseInt(filters.offset ?? 0, 10), 0);
  let sql = `SELECT * FROM ${config.table} WHERE project_id = $1 AND deleted_at IS NULL`;
  const params = [projectId];
  let i = 2;

  for (const field of config.insert.filter(column => column !== 'project_id')) {
    const value = filters[field];
    if (value !== undefined && value !== '') {
      sql += ` AND ${field} = $${i++}`;
      params.push(value);
    }
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
  sql += ` ORDER BY ${config.orderBy} LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const [rows, count] = await Promise.all([
    query(sql, params),
    query(countSql, params.slice(0, -2)),
  ]);

  return { [config.collection]: rows.rows, total: parseInt(count.rows[0].count, 10), limit, offset };
}

export async function createPhase2Record(configKey, projectId, payload = {}) {
  const config = PHASE2_TABLES[configKey];
  const columns = config.insert.filter(field => field === 'project_id' || payload[field] !== undefined);
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const values = columns.map(field => field === 'project_id' ? projectId : stringifyValue(config, field, payload[field]));

  const result = await query(
    `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values
  );
  return { [config.collection.slice(0, -1) || 'record']: result.rows[0], record: result.rows[0] };
}

export async function updatePhase2Record(configKey, projectId, id, payload = {}) {
  const config = PHASE2_TABLES[configKey];
  const editable = config.insert.filter(field => field !== 'project_id' && payload[field] !== undefined);
  if (!editable.length) return null;

  const assignments = editable.map((field, index) => `${field} = $${index + 1}`);
  const values = editable.map(field => stringifyValue(config, field, payload[field]));
  values.push(id, projectId);

  const result = await query(
    `UPDATE ${config.table}
     SET ${assignments.join(', ')}, updated_at = NOW()
     WHERE id = $${values.length - 1} AND project_id = $${values.length} AND deleted_at IS NULL
     RETURNING *`,
    values
  );
  return result.rows[0] ?? null;
}

export async function getPhase2Record(configKey, projectId, id) {
  const config = PHASE2_TABLES[configKey];
  const result = await query(
    `SELECT * FROM ${config.table} WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [id, projectId]
  );
  return result.rows[0] ?? null;
}

export async function deletePhase2Record(configKey, projectId, id) {
  const config = PHASE2_TABLES[configKey];
  const result = await query(
    `UPDATE ${config.table} SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  return result.rows[0]?.id ?? null;
}
