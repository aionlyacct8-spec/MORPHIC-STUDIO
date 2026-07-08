import { query } from '../services/db.js';

function runner(client) {
  return client ?? { query };
}

export async function listAssets(projectId, filters = {}) {
  const { type, subtype, tag, search, source, status } = filters;
  const limit = Math.min(parseInt(filters.limit ?? 50, 10), 200);
  const offset = Math.max(parseInt(filters.offset ?? 0, 10), 0);

  let sql = 'SELECT * FROM assets WHERE project_id = $1 AND deleted_at IS NULL';
  const params = [projectId];
  let i = 2;

  if (type) { sql += ` AND type = $${i++}`; params.push(type); }
  if (subtype) { sql += ` AND subtype = $${i++}`; params.push(subtype); }
  if (tag) { sql += ` AND $${i++} = ANY(tags)`; params.push(tag); }
  if (source) { sql += ` AND source = $${i++}`; params.push(source); }
  if (status) { sql += ` AND COALESCE(status, 'ready') = $${i++}`; params.push(status); }
  if (search) {
    sql += ` AND (name ILIKE $${i} OR description ILIKE $${i++})`;
    params.push(`%${search}%`);
  }

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*)');
  const countResult = await query(countSql, params);
  const total = parseInt(countResult.rows[0].count, 10);

  sql += ` ORDER BY usage_count DESC, created_at DESC LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return { assets: result.rows, total, limit, offset };
}

export async function findAssetById(projectId, id, client) {
  const result = await runner(client).query(
    'SELECT * FROM assets WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
    [id, projectId]
  );
  return result.rows[0] ?? null;
}

export async function insertAsset(projectId, asset, client) {
  const result = await runner(client).query(
    `INSERT INTO assets
       (project_id, name, type, subtype, description, file_url, thumbnail, metadata, tags, source, linked_id, version_number, status, provenance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1,COALESCE($12,'ready'),$13) RETURNING *`,
    [
      projectId,
      asset.name,
      asset.type,
      asset.subtype ?? null,
      asset.description ?? null,
      asset.file_url ?? null,
      asset.thumbnail ?? null,
      JSON.stringify(asset.metadata ?? {}),
      asset.tags ?? [],
      asset.source ?? 'manual',
      asset.linked_id ?? null,
      asset.status ?? 'ready',
      JSON.stringify(asset.provenance ?? {}),
    ]
  );
  return result.rows[0];
}

export async function updateAsset(projectId, id, changes) {
  const result = await query(
    `UPDATE assets SET
       name = COALESCE($1, name),
       subtype = COALESCE($2, subtype),
       description = COALESCE($3, description),
       file_url = COALESCE($4, file_url),
       thumbnail = COALESCE($5, thumbnail),
       metadata = COALESCE($6, metadata),
       tags = COALESCE($7, tags),
       status = COALESCE($8, status),
       provenance = COALESCE($9, provenance),
       updated_at = NOW()
     WHERE id = $10 AND project_id = $11 AND deleted_at IS NULL RETURNING *`,
    [
      changes.name ?? null,
      changes.subtype ?? null,
      changes.description ?? null,
      changes.file_url ?? null,
      changes.thumbnail ?? null,
      changes.metadata ? JSON.stringify(changes.metadata) : null,
      changes.tags ?? null,
      changes.status ?? null,
      changes.provenance ? JSON.stringify(changes.provenance) : null,
      id,
      projectId,
    ]
  );
  return result.rows[0] ?? null;
}

export async function incrementAssetUsage(projectId, id) {
  const result = await query(
    'UPDATE assets SET usage_count = usage_count + 1 WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id, usage_count',
    [id, projectId]
  );
  return result.rows[0] ?? null;
}

export async function softDeleteAsset(projectId, id) {
  const result = await query(
    'UPDATE assets SET deleted_at = NOW() WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id',
    [id, projectId]
  );
  return result.rows[0] ?? null;
}

export async function getAssetStats(projectId) {
  const result = await query(
    `SELECT type, COUNT(*) as count, SUM(usage_count) as total_uses
     FROM assets WHERE project_id = $1 AND deleted_at IS NULL GROUP BY type ORDER BY count DESC`,
    [projectId]
  );
  return result.rows;
}

export async function listAssetVersions(projectId, assetId) {
  const result = await query(
    'SELECT * FROM asset_versions WHERE asset_id = $1 AND project_id = $2 ORDER BY version_number DESC',
    [assetId, projectId]
  );
  return result.rows;
}

export async function insertAssetVersion(projectId, assetId, versionNumber, version, client) {
  const result = await runner(client).query(
    `INSERT INTO asset_versions
       (asset_id, project_id, version_number, file_url, thumbnail, metadata, notes, created_by, storage_object_id, provenance, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,COALESCE($11,'ready')) RETURNING *`,
    [
      assetId,
      projectId,
      versionNumber,
      version.file_url ?? null,
      version.thumbnail ?? null,
      JSON.stringify(version.metadata ?? {}),
      version.notes ?? '',
      version.created_by ?? 'user',
      version.storage_object_id ?? null,
      JSON.stringify(version.provenance ?? {}),
      version.status ?? 'ready',
    ]
  );
  return result.rows[0];
}

export async function setCurrentVersion(projectId, assetId, version, client) {
  await runner(client).query(
    `UPDATE assets SET version_number = $1, current_version_id = $2,
       file_url = COALESCE($3, file_url), thumbnail = COALESCE($4, thumbnail), updated_at = NOW()
     WHERE id = $5 AND project_id = $6`,
    [version.version_number, version.id, version.file_url ?? null, version.thumbnail ?? null, assetId, projectId]
  );
}

export async function insertStorageObject(projectId, storageObject, client) {
  const result = await runner(client).query(
    `INSERT INTO storage_objects
       (project_id, asset_id, asset_version_id, bucket, object_key, file_path, file_url, mime_type, byte_size, checksum, metadata, storage_provider, lifecycle_status)
     VALUES ($1,$2,$3,COALESCE($4,'local'),$5,$6,$7,$8,COALESCE($9,0),$10,$11,COALESCE($12,'local'),COALESCE($13,'active')) RETURNING *`,
    [
      projectId,
      storageObject.asset_id ?? null,
      storageObject.asset_version_id ?? null,
      storageObject.bucket ?? 'local',
      storageObject.object_key,
      storageObject.file_path ?? null,
      storageObject.file_url ?? null,
      storageObject.mime_type ?? null,
      storageObject.byte_size ?? 0,
      storageObject.checksum ?? null,
      JSON.stringify(storageObject.metadata ?? {}),
      storageObject.storage_provider ?? 'local',
      storageObject.lifecycle_status ?? 'active',
    ]
  );
  return result.rows[0];
}

export async function listStorageObjects(projectId, assetId) {
  const result = await query(
    `SELECT * FROM storage_objects
     WHERE project_id = $1 AND asset_id = $2 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [projectId, assetId]
  );
  return result.rows;
}

export async function listRelationships(projectId, assetId) {
  const result = await query(
    `SELECT * FROM asset_relationships
     WHERE project_id = $1 AND deleted_at IS NULL AND (source_asset_id = $2 OR target_asset_id = $2)
     ORDER BY created_at DESC`,
    [projectId, assetId]
  );
  return result.rows;
}

export async function insertRelationship(projectId, relationship) {
  const result = await query(
    `INSERT INTO asset_relationships
       (project_id, source_asset_id, target_asset_id, relationship_type, metadata, created_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (project_id, source_asset_id, target_asset_id, relationship_type)
       WHERE deleted_at IS NULL
       DO UPDATE SET metadata = EXCLUDED.metadata, updated_at = NOW()
     RETURNING *`,
    [
      projectId,
      relationship.source_asset_id,
      relationship.target_asset_id,
      relationship.relationship_type,
      JSON.stringify(relationship.metadata ?? {}),
      relationship.created_by ?? 'user',
    ]
  );
  return result.rows[0];
}
