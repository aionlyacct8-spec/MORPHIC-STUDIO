import { transaction } from './db.js';
import * as assetsRepository from '../repositories/assetsRepository.js';
import { createError } from '../middleware/errorHandler.js';

export const VALID_ASSET_TYPES = [
  'character',
  'outfit',
  'background',
  'prop',
  'location',
  'building',
  'map',
  'scene',
  'animation',
  'camera_preset',
  'lighting',
  'particle',
  'material',
  'audio',
  'voice',
  'panel',
  'style',
  'mask',
  'reference',
  'export',
  'rig',
  'pose',
  'expression',
];

export const VALID_ASSET_SOURCES = ['manual', 'user', 'authored', 'imported', 'ai_assisted', 'ai_generated', 'rendered', 'exported', 'adapter'];
export const VALID_ASSET_STATUSES = ['draft', 'ready', 'review', 'approved', 'archived', 'blocked'];
export const VALID_RELATIONSHIP_TYPES = ['derived_from', 'variant_of', 'uses', 'part_of', 'references', 'replaces', 'requires', 'matches_character'];

function validateAssetInput(asset) {
  if (!asset.name) throw createError(400, 'Asset name is required.');
  if (!asset.type) throw createError(400, 'Asset type is required.');
  if (!VALID_ASSET_TYPES.includes(asset.type)) throw createError(400, `Invalid type "${asset.type}". Valid: ${VALID_ASSET_TYPES.join(', ')}`);
  if (asset.source && !VALID_ASSET_SOURCES.includes(asset.source)) throw createError(400, `Invalid source "${asset.source}". Valid: ${VALID_ASSET_SOURCES.join(', ')}`);
  if (asset.status && !VALID_ASSET_STATUSES.includes(asset.status)) throw createError(400, `Invalid status "${asset.status}". Valid: ${VALID_ASSET_STATUSES.join(', ')}`);
}

function validateRelationshipInput(relationship) {
  if (!relationship.source_asset_id) throw createError(400, 'source_asset_id is required.');
  if (!relationship.target_asset_id) throw createError(400, 'target_asset_id is required.');
  if (relationship.source_asset_id === relationship.target_asset_id) throw createError(400, 'An asset cannot relate to itself.');
  if (!relationship.relationship_type) throw createError(400, 'relationship_type is required.');
  if (!VALID_RELATIONSHIP_TYPES.includes(relationship.relationship_type)) {
    throw createError(400, `Invalid relationship_type "${relationship.relationship_type}". Valid: ${VALID_RELATIONSHIP_TYPES.join(', ')}`);
  }
}

export async function listAssets(projectId, filters) {
  return assetsRepository.listAssets(projectId, filters);
}

export async function getAsset(projectId, id) {
  const asset = await assetsRepository.findAssetById(projectId, id);
  if (!asset) throw createError(404, 'Asset not found.');
  const [versions, storageObjects, relationships] = await Promise.all([
    assetsRepository.listAssetVersions(projectId, id),
    assetsRepository.listStorageObjects(projectId, id),
    assetsRepository.listRelationships(projectId, id),
  ]);
  return { asset, versions, storageObjects, relationships };
}

export async function createAsset(projectId, payload) {
  validateAssetInput(payload);
  return transaction(async (client) => {
    const asset = await assetsRepository.insertAsset(projectId, payload, client);
    let storageObject = null;
    let version = null;

    if (payload.storage_object) {
      if (!payload.storage_object.object_key) throw createError(400, 'storage_object.object_key is required.');
      storageObject = await assetsRepository.insertStorageObject(projectId, {
        ...payload.storage_object,
        asset_id: asset.id,
      }, client);
    }

    if (payload.file_url || payload.thumbnail || payload.create_initial_version !== false || storageObject) {
      version = await assetsRepository.insertAssetVersion(projectId, asset.id, 1, {
        file_url: payload.file_url ?? storageObject?.file_url,
        thumbnail: payload.thumbnail,
        metadata: payload.metadata ?? {},
        notes: payload.initial_version_notes ?? 'Initial version',
        created_by: payload.created_by ?? payload.source ?? 'user',
        storage_object_id: storageObject?.id,
        provenance: payload.provenance ?? {},
        status: payload.status ?? 'ready',
      }, client);
      await assetsRepository.setCurrentVersion(projectId, asset.id, version, client);
    }

    return { asset, version, storageObject };
  });
}

export async function updateAsset(projectId, id, payload) {
  if (payload.type && !VALID_ASSET_TYPES.includes(payload.type)) throw createError(400, 'Asset type cannot be changed through this endpoint.');
  if (payload.source && !VALID_ASSET_SOURCES.includes(payload.source)) throw createError(400, `Invalid source "${payload.source}".`);
  if (payload.status && !VALID_ASSET_STATUSES.includes(payload.status)) throw createError(400, `Invalid status "${payload.status}".`);
  const asset = await assetsRepository.updateAsset(projectId, id, payload);
  if (!asset) throw createError(404, 'Asset not found.');
  return asset;
}

export async function incrementUsage(projectId, id) {
  const asset = await assetsRepository.incrementAssetUsage(projectId, id);
  if (!asset) throw createError(404, 'Asset not found.');
  return asset;
}

export async function deleteAsset(projectId, id) {
  const asset = await assetsRepository.softDeleteAsset(projectId, id);
  if (!asset) throw createError(404, 'Asset not found.');
  return asset.id;
}

export async function getStats(projectId) {
  return assetsRepository.getAssetStats(projectId);
}

export async function listVersions(projectId, id) {
  const asset = await assetsRepository.findAssetById(projectId, id);
  if (!asset) throw createError(404, 'Asset not found.');
  return assetsRepository.listAssetVersions(projectId, id);
}

export async function createVersion(projectId, id, payload) {
  return transaction(async (client) => {
    const asset = await assetsRepository.findAssetById(projectId, id, client);
    if (!asset) throw createError(404, 'Asset not found.');

    let storageObject = null;
    if (payload.storage_object) {
      if (!payload.storage_object.object_key) throw createError(400, 'storage_object.object_key is required.');
      storageObject = await assetsRepository.insertStorageObject(projectId, {
        ...payload.storage_object,
        asset_id: id,
      }, client);
    }

    const nextVersion = (asset.version_number ?? 1) + 1;
    const version = await assetsRepository.insertAssetVersion(projectId, id, nextVersion, {
      ...payload,
      file_url: payload.file_url ?? storageObject?.file_url,
      storage_object_id: storageObject?.id ?? payload.storage_object_id,
    }, client);

    if (storageObject) {
      await client.query('UPDATE storage_objects SET asset_version_id = $1 WHERE id = $2 AND project_id = $3', [version.id, storageObject.id, projectId]);
    }

    await assetsRepository.setCurrentVersion(projectId, id, version, client);
    return { version, storageObject };
  });
}

export async function listStorageObjects(projectId, id) {
  const asset = await assetsRepository.findAssetById(projectId, id);
  if (!asset) throw createError(404, 'Asset not found.');
  return assetsRepository.listStorageObjects(projectId, id);
}

export async function createRelationship(projectId, id, payload) {
  const relationship = { ...payload, source_asset_id: payload.source_asset_id ?? id };
  validateRelationshipInput(relationship);

  const [source, target] = await Promise.all([
    assetsRepository.findAssetById(projectId, relationship.source_asset_id),
    assetsRepository.findAssetById(projectId, relationship.target_asset_id),
  ]);
  if (!source) throw createError(404, 'Source asset not found.');
  if (!target) throw createError(404, 'Target asset not found.');

  return assetsRepository.insertRelationship(projectId, relationship);
}

export async function listRelationships(projectId, id) {
  const asset = await assetsRepository.findAssetById(projectId, id);
  if (!asset) throw createError(404, 'Asset not found.');
  return assetsRepository.listRelationships(projectId, id);
}
