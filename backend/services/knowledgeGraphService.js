/**
 * Knowledge Graph Service
 *
 * Manages nodes and edges for the Morphic Studio knowledge graph.
 * Entities: characters, worlds, locations, props, episodes, scenes,
 *           organizations, events, weapons, vehicles.
 *
 * Relations: lives_in | owns | appears_in | belongs_to | uses | wears |
 *            knows | enemy_of | allied_with | created_by | contains
 */

import { query } from './db.js';
import eventBus from './eventBus.js';
import logger from '../utils/logger.js';

const log = logger.child('knowledgeGraph');

const VALID_ENTITY_TYPES = [
  'character', 'world', 'location', 'prop', 'episode',
  'scene', 'organization', 'event', 'weapon', 'vehicle', 'story',
];

const VALID_RELATIONS = [
  'lives_in', 'owns', 'appears_in', 'belongs_to', 'uses',
  'wears', 'knows', 'enemy_of', 'allied_with', 'created_by',
  'contains', 'part_of', 'related_to',
];

// ── Node operations ───────────────────────────────────────────────────────────

/**
 * upsertNode — create or update a knowledge graph node.
 * Safe to call repeatedly; uses UPSERT on (project_id, entity_id, entity_type).
 */
export async function upsertNode(projectId, { entityId, entityType, label, properties = {} }) {
  if (!VALID_ENTITY_TYPES.includes(entityType)) {
    throw new Error(`Invalid entity type: "${entityType}". Valid: ${VALID_ENTITY_TYPES.join(', ')}`);
  }

  const res = await query(
    `INSERT INTO knowledge_graph_nodes (project_id, entity_id, entity_type, label, properties)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (project_id, entity_id, entity_type)
     DO UPDATE SET label = EXCLUDED.label, properties = EXCLUDED.properties, updated_at = NOW()
     RETURNING *`,
    [projectId, entityId, entityType, label, JSON.stringify(properties)]
  );

  const node = res.rows[0];
  log.info('Node upserted', { projectId, entityType, label });
  eventBus.emit('knowledge_graph:node_upserted', { projectId, node });
  return node;
}

/**
 * getNode — fetch a single node by entity ID and type.
 */
export async function getNode(projectId, entityId, entityType) {
  const res = await query(
    `SELECT * FROM knowledge_graph_nodes
     WHERE project_id = $1 AND entity_id = $2 AND entity_type = $3`,
    [projectId, entityId, entityType]
  );
  return res.rows[0] ?? null;
}

/**
 * listNodes — fetch all nodes for a project, optionally filtered by type.
 */
export async function listNodes(projectId, { entityType, search, limit = 200, offset = 0 } = {}) {
  let sql = `SELECT * FROM knowledge_graph_nodes WHERE project_id = $1`;
  const params = [projectId];
  let i = 2;

  if (entityType) { sql += ` AND entity_type = $${i++}`; params.push(entityType); }
  if (search)     { sql += ` AND label ILIKE $${i++}`;   params.push(`%${search}%`); }

  sql += ` ORDER BY entity_type, label LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const res = await query(sql, params);
  return res.rows;
}

/**
 * deleteNode — remove a node and all its edges (cascade).
 */
export async function deleteNode(projectId, entityId, entityType) {
  const nodeRes = await query(
    `SELECT id FROM knowledge_graph_nodes WHERE project_id = $1 AND entity_id = $2 AND entity_type = $3`,
    [projectId, entityId, entityType]
  );
  if (!nodeRes.rows.length) return false;
  const nodeId = nodeRes.rows[0].id;

  await query(
    `DELETE FROM knowledge_graph_edges WHERE from_node_id = $1 OR to_node_id = $1`,
    [nodeId]
  );
  await query(`DELETE FROM knowledge_graph_nodes WHERE id = $1`, [nodeId]);
  eventBus.emit('knowledge_graph:node_deleted', { projectId, entityId, entityType });
  return true;
}

// ── Edge operations ───────────────────────────────────────────────────────────

/**
 * upsertEdge — create or update a directed edge between two entities.
 * Nodes are auto-created with minimal data if they don't exist yet.
 */
export async function upsertEdge(projectId, {
  fromEntityId, fromEntityType, fromLabel = '',
  toEntityId,   toEntityType,   toLabel   = '',
  relation, weight = 1.0, metadata = {},
}) {
  if (!VALID_RELATIONS.includes(relation)) {
    throw new Error(`Invalid relation: "${relation}". Valid: ${VALID_RELATIONS.join(', ')}`);
  }

  // Ensure both nodes exist
  const [fromNode, toNode] = await Promise.all([
    upsertNode(projectId, { entityId: fromEntityId, entityType: fromEntityType, label: fromLabel }),
    upsertNode(projectId, { entityId: toEntityId,   entityType: toEntityType,   label: toLabel }),
  ]);

  const res = await query(
    `INSERT INTO knowledge_graph_edges (project_id, from_node_id, to_node_id, relation, weight, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (from_node_id, to_node_id, relation)
     DO UPDATE SET weight = EXCLUDED.weight, metadata = EXCLUDED.metadata
     RETURNING *`,
    [projectId, fromNode.id, toNode.id, relation, weight, JSON.stringify(metadata)]
  );

  const edge = res.rows[0];
  eventBus.emit('knowledge_graph:edge_upserted', { projectId, edge, relation });
  return { edge, fromNode, toNode };
}

/**
 * listEdges — get edges for a project, optionally filtered by node or relation.
 */
export async function listEdges(projectId, { nodeId, relation, limit = 500 } = {}) {
  let sql = `
    SELECT e.*,
      fn.label AS from_label, fn.entity_type AS from_type, fn.entity_id AS from_entity_id,
      tn.label AS to_label,   tn.entity_type AS to_type,   tn.entity_id AS to_entity_id
    FROM knowledge_graph_edges e
    JOIN knowledge_graph_nodes fn ON fn.id = e.from_node_id
    JOIN knowledge_graph_nodes tn ON tn.id = e.to_node_id
    WHERE e.project_id = $1
  `;
  const params = [projectId];
  let i = 2;

  if (nodeId)   { sql += ` AND (e.from_node_id = $${i} OR e.to_node_id = $${i++})`; params.push(nodeId); }
  if (relation) { sql += ` AND e.relation = $${i++}`; params.push(relation); }

  sql += ` ORDER BY fn.label, e.relation LIMIT $${i}`;
  params.push(limit);

  const res = await query(sql, params);
  return res.rows;
}

/**
 * getNeighbors — get all directly connected entities for a given entity.
 */
export async function getNeighbors(projectId, entityId, entityType, maxDepth = 1) {
  const nodeRes = await query(
    `SELECT id FROM knowledge_graph_nodes WHERE project_id = $1 AND entity_id = $2 AND entity_type = $3`,
    [projectId, entityId, entityType]
  );
  if (!nodeRes.rows.length) return { outgoing: [], incoming: [] };
  const nodeId = nodeRes.rows[0].id;

  const [outgoing, incoming] = await Promise.all([
    query(
      `SELECT e.relation, e.weight, n.label, n.entity_type, n.entity_id
       FROM knowledge_graph_edges e
       JOIN knowledge_graph_nodes n ON n.id = e.to_node_id
       WHERE e.from_node_id = $1`,
      [nodeId]
    ),
    query(
      `SELECT e.relation, e.weight, n.label, n.entity_type, n.entity_id
       FROM knowledge_graph_edges e
       JOIN knowledge_graph_nodes n ON n.id = e.from_node_id
       WHERE e.to_node_id = $1`,
      [nodeId]
    ),
  ]);

  return { outgoing: outgoing.rows, incoming: incoming.rows };
}

/**
 * getFullGraph — return all nodes + edges for a project (for frontend visualizer).
 */
export async function getFullGraph(projectId) {
  const [nodesRes, edgesRes] = await Promise.all([
    query(`SELECT * FROM knowledge_graph_nodes WHERE project_id = $1 ORDER BY entity_type, label`, [projectId]),
    query(
      `SELECT e.*, fn.entity_id AS from_entity_id, fn.entity_type AS from_type, fn.label AS from_label,
                     tn.entity_id AS to_entity_id,   tn.entity_type AS to_type,   tn.label AS to_label
       FROM knowledge_graph_edges e
       JOIN knowledge_graph_nodes fn ON fn.id = e.from_node_id
       JOIN knowledge_graph_nodes tn ON tn.id = e.to_node_id
       WHERE e.project_id = $1`,
      [projectId]
    ),
  ]);

  return { nodes: nodesRes.rows, edges: edgesRes.rows };
}

/**
 * syncEntityToGraph — convenience: called after creating/updating any entity
 * to keep the knowledge graph in sync.
 */
export async function syncEntityToGraph(projectId, { entityId, entityType, label, properties = {} }) {
  return upsertNode(projectId, { entityId, entityType, label, properties });
}

export default {
  upsertNode, getNode, listNodes, deleteNode,
  upsertEdge, listEdges, getNeighbors, getFullGraph,
  syncEntityToGraph,
};
