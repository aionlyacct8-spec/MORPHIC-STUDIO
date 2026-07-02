/**
 * Knowledge Graph Controller
 */

import * as kg from '../services/knowledgeGraphService.js';
import { createError } from '../middleware/errorHandler.js';

// GET /api/projects/:projectId/graph
export async function getFullGraph(req, res) {
  const { projectId } = req.params;
  const graph = await kg.getFullGraph(projectId);
  res.json(graph);
}

// GET /api/projects/:projectId/graph/nodes
export async function listNodes(req, res) {
  const { projectId } = req.params;
  const { type, search, limit = 200, offset = 0 } = req.query;
  const nodes = await kg.listNodes(projectId, {
    entityType: type,
    search,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
  res.json({ nodes, count: nodes.length });
}

// POST /api/projects/:projectId/graph/nodes
export async function upsertNode(req, res) {
  const { projectId } = req.params;
  const { entityId, entityType, label, properties } = req.body;

  if (!entityId)   throw createError(400, 'entityId is required.');
  if (!entityType) throw createError(400, 'entityType is required.');
  if (!label)      throw createError(400, 'label is required.');

  const node = await kg.upsertNode(projectId, { entityId, entityType, label, properties });
  res.status(201).json({ node });
}

// DELETE /api/projects/:projectId/graph/nodes
export async function deleteNode(req, res) {
  const { projectId } = req.params;
  const { entityId, entityType } = req.body;

  if (!entityId || !entityType) throw createError(400, 'entityId and entityType are required.');

  const deleted = await kg.deleteNode(projectId, entityId, entityType);
  if (!deleted) throw createError(404, 'Node not found.');
  res.json({ deleted: true });
}

// GET /api/projects/:projectId/graph/edges
export async function listEdges(req, res) {
  const { projectId } = req.params;
  const { nodeId, relation, limit = 500 } = req.query;
  const edges = await kg.listEdges(projectId, { nodeId, relation, limit: parseInt(limit, 10) });
  res.json({ edges, count: edges.length });
}

// POST /api/projects/:projectId/graph/edges
export async function upsertEdge(req, res) {
  const { projectId } = req.params;
  const {
    fromEntityId, fromEntityType, fromLabel,
    toEntityId,   toEntityType,   toLabel,
    relation, weight, metadata,
  } = req.body;

  if (!fromEntityId || !fromEntityType) throw createError(400, 'fromEntityId and fromEntityType required.');
  if (!toEntityId   || !toEntityType)   throw createError(400, 'toEntityId and toEntityType required.');
  if (!relation)                         throw createError(400, 'relation is required.');

  const result = await kg.upsertEdge(projectId, {
    fromEntityId, fromEntityType, fromLabel: fromLabel ?? '',
    toEntityId,   toEntityType,   toLabel:   toLabel   ?? '',
    relation, weight, metadata,
  });
  res.status(201).json(result);
}

// GET /api/projects/:projectId/graph/neighbors/:entityId
export async function getNeighbors(req, res) {
  const { projectId, entityId } = req.params;
  const { type } = req.query;
  if (!type) throw createError(400, 'Query param "type" (entity type) is required.');

  const neighbors = await kg.getNeighbors(projectId, entityId, type);
  res.json(neighbors);
}
