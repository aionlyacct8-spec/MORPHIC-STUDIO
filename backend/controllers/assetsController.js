import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';
import { syncEntityToGraph, upsertEdge } from '../services/knowledgeGraphService.js';
import * as assetService from '../services/assetService.js';

const log = logger.child('assetsController');

const KG_TYPE_MAP = {
  character: 'character',
  prop: 'prop',
  location: 'location',
  scene: 'scene',
};

function syncAssetToKnowledgeGraph(projectId, asset) {
  const kgType = KG_TYPE_MAP[asset.type];
  if (!kgType) return;

  syncEntityToGraph(projectId, {
    entityId: asset.id,
    entityType: kgType,
    label: asset.name,
    properties: {
      subtype: asset.subtype,
      description: asset.description,
      source: asset.source,
      linked_id: asset.linked_id,
    },
  }).catch(err => log.debug('KG sync skipped (DB may not be ready)', { err: err.message }));

  if (asset.linked_id) {
    upsertEdge(projectId, {
      fromEntityId: asset.id,
      fromEntityType: kgType,
      fromLabel: asset.name,
      toEntityId: asset.linked_id,
      toEntityType: kgType,
      toLabel: '',
      relation: 'related_to',
      metadata: { reason: 'asset_dependency' },
    }).catch(() => {});
  }
}

export async function listAssets(req, res) {
  const { projectId } = req.params;
  const result = await assetService.listAssets(projectId, req.query);
  res.json(result);
}

export async function getAsset(req, res) {
  const { projectId, id } = req.params;
  const result = await assetService.getAsset(projectId, id);
  res.json(result);
}

export async function createAsset(req, res) {
  const { projectId } = req.params;
  const result = await assetService.createAsset(projectId, req.body);
  syncAssetToKnowledgeGraph(projectId, result.asset);
  eventBus.emit('asset:created', { projectId, asset: result.asset });
  log.info('Asset created', { id: result.asset.id, name: result.asset.name, type: result.asset.type });
  res.status(201).json(result);
}

export async function updateAsset(req, res) {
  const { projectId, id } = req.params;
  const asset = await assetService.updateAsset(projectId, id, req.body);
  eventBus.emit('asset:updated', { projectId, id, changes: req.body });
  res.json({ asset });
}

export async function incrementUsage(req, res) {
  const { projectId, id } = req.params;
  const asset = await assetService.incrementUsage(projectId, id);
  eventBus.emit('asset:used', { projectId, id });
  res.json({ id, usage_count: asset.usage_count });
}

export async function deleteAsset(req, res) {
  const { projectId, id } = req.params;
  const deleted = await assetService.deleteAsset(projectId, id);
  eventBus.emit('asset:deleted', { projectId, id });
  res.json({ deleted });
}

export async function getAssetStats(req, res) {
  const { projectId } = req.params;
  const stats = await assetService.getStats(projectId);
  res.json({ stats });
}

export async function listVersions(req, res) {
  const { projectId, id } = req.params;
  const versions = await assetService.listVersions(projectId, id);
  res.json({ versions });
}

export async function createVersion(req, res) {
  const { projectId, id } = req.params;
  const result = await assetService.createVersion(projectId, id, req.body);
  eventBus.emit('asset:version_created', { projectId, id, versionNum: result.version.version_number });
  log.info('Asset version created', { id, version: result.version.version_number });
  res.status(201).json(result);
}

export async function listStorageObjects(req, res) {
  const { projectId, id } = req.params;
  const storageObjects = await assetService.listStorageObjects(projectId, id);
  res.json({ storageObjects });
}

export async function listRelationships(req, res) {
  const { projectId, id } = req.params;
  const relationships = await assetService.listRelationships(projectId, id);
  res.json({ relationships });
}

export async function createRelationship(req, res) {
  const { projectId, id } = req.params;
  const relationship = await assetService.createRelationship(projectId, id, req.body);
  eventBus.emit('asset:updated', { projectId, id, changes: { relationship } });
  res.status(201).json({ relationship });
}
