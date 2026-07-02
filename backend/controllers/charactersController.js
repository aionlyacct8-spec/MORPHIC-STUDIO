/**
 * Characters Controller — with pagination, soft delete, and KG sync.
 */

import { query } from '../services/db.js';
import { buildContext, appendMemory } from '../services/brainService.js';
import { syncEntityToGraph } from '../services/knowledgeGraphService.js';
import { generateDNA, evolveCharacter, suggestRelationships } from '../agents/characterAgent.js';
import { createError } from '../middleware/errorHandler.js';
import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';

const log = logger.child('charactersController');

function paginate(req) {
  const limit  = Math.min(parseInt(req.query.limit  ?? 50,  10), 200);
  const offset = Math.max(parseInt(req.query.offset ?? 0,   10), 0);
  return { limit, offset };
}

export async function listCharacters(req, res) {
  const { projectId } = req.params;
  const { limit, offset } = paginate(req);
  const { role, status, search } = req.query;

  let sql = `SELECT * FROM characters WHERE project_id = $1 AND deleted_at IS NULL`;
  const params = [projectId];
  let i = 2;

  if (role)   { sql += ` AND role = $${i++}`;            params.push(role); }
  if (status) { sql += ` AND status = $${i++}`;          params.push(status); }
  if (search) { sql += ` AND name ILIKE $${i++}`;        params.push(`%${search}%`); }

  sql += ` ORDER BY role ASC, name ASC LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const [result, countResult] = await Promise.all([
    query(sql, params),
    query(
      `SELECT COUNT(*) FROM characters WHERE project_id = $1 AND deleted_at IS NULL`,
      [projectId]
    ),
  ]);

  res.json({
    characters: result.rows,
    total:      parseInt(countResult.rows[0].count, 10),
    limit, offset,
  });
}

export async function getCharacter(req, res) {
  const { projectId, id } = req.params;
  const charResult = await query(
    'SELECT * FROM characters WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
    [id, projectId]
  );
  if (!charResult.rows.length) throw createError(404, 'Character not found.');

  const history = await query(
    'SELECT * FROM character_history WHERE character_id = $1 ORDER BY created_at DESC LIMIT 20',
    [id]
  );

  res.json({ character: charResult.rows[0], history: history.rows });
}

export async function createCharacter(req, res) {
  const { projectId } = req.params;
  const { name, role, description, generateAI } = req.body;
  if (!name) throw createError(400, 'Character name is required.');

  let visual_dna    = req.body.visual_dna    ?? {};
  let personality   = req.body.personality   ?? {};
  let voice_profile = req.body.voice_profile ?? {};

  // AI-generate full DNA if requested
  if (generateAI) {
    log.info('Generating character DNA via AI', { name });
    const brainContext = await buildContext(projectId);
    const proj = await query('SELECT genre FROM projects WHERE id = $1', [projectId]);
    const dna = await generateDNA({
      name, role: role ?? 'supporting',
      description: description ?? '',
      genre: proj.rows[0]?.genre ?? '',
      brainContext,
    });
    visual_dna    = dna.visual_dna    ?? visual_dna;
    personality   = dna.personality   ?? personality;
    voice_profile = dna.voice_profile ?? voice_profile;
  }

  const result = await query(
    `INSERT INTO characters (project_id, name, role, visual_dna, personality, voice_profile)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [projectId, name, role ?? 'supporting',
     JSON.stringify(visual_dna), JSON.stringify(personality), JSON.stringify(voice_profile)]
  );
  const character = result.rows[0];

  // Save to brain memory + knowledge graph
  await Promise.all([
    appendMemory(projectId, {
      agentType:  'character',
      memoryType: 'fact',
      content:    `Character "${name}" (${role ?? 'supporting'}) added to the project.`,
      importance: 6,
      refs: [{ entity_type: 'character', entity_id: character.id, label: name }],
    }),
    syncEntityToGraph(projectId, {
      entityId:   character.id,
      entityType: 'character',
      label:      name,
      properties: { role: role ?? 'supporting' },
    }).catch(() => {}), // non-critical if KG table not yet migrated
  ]);

  eventBus.emit('character:created', { projectId, character });
  log.info('Character created', { id: character.id, name });
  res.status(201).json({ character });
}

export async function updateCharacter(req, res) {
  const { projectId, id } = req.params;
  const FIELDS = [
    'name', 'role', 'visual_dna', 'personality', 'voice_profile',
    'relationships', 'outfit_history', 'arc_progress', 'status', 'notes',
  ];

  const updates = [];
  const values  = [];
  let i = 1;

  for (const field of FIELDS) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${i++}`);
      const val = req.body[field];
      values.push(typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }

  if (!updates.length) throw createError(400, 'No fields to update.');
  values.push(id, projectId);

  const result = await query(
    `UPDATE characters SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${i} AND project_id = $${i + 1} AND deleted_at IS NULL RETURNING *`,
    values
  );
  if (!result.rows.length) throw createError(404, 'Character not found.');

  eventBus.emit('character:updated', { projectId, id, changes: req.body });
  res.json({ character: result.rows[0] });
}

export async function evolveCharacterHandler(req, res) {
  const { projectId, id } = req.params;
  const { event, sceneReference } = req.body;
  if (!event) throw createError(400, '"event" description is required.');

  const charResult = await query(
    'SELECT * FROM characters WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
    [id, projectId]
  );
  if (!charResult.rows.length) throw createError(404, 'Character not found.');
  const character = charResult.rows[0];

  const brainContext = await buildContext(projectId);
  const evolution = await evolveCharacter({ character, event, sceneReference, brainContext });

  // Record history
  await query(
    `INSERT INTO character_history
       (character_id, event_type, description, before_state, after_state, scene_reference)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id, evolution.event_type ?? 'evolution', event,
      JSON.stringify({ personality: character.personality, status: character.status }),
      JSON.stringify(evolution.changes ?? {}),
      sceneReference ?? '',
    ]
  );

  // Apply changes
  if (evolution.changes) {
    await query(
      `UPDATE characters SET
         visual_dna    = COALESCE($1, visual_dna),
         personality   = COALESCE($2, personality),
         status        = COALESCE($3, status),
         arc_progress  = LEAST(100, arc_progress + $4),
         updated_at    = NOW()
       WHERE id = $5`,
      [
        evolution.changes.visual_dna  ? JSON.stringify(evolution.changes.visual_dna)  : null,
        evolution.changes.personality ? JSON.stringify(evolution.changes.personality) : null,
        evolution.changes.status ?? null,
        evolution.arc_progress_delta ?? 0,
        id,
      ]
    );
  }

  // Save memory note
  if (evolution.memory_note) {
    await appendMemory(projectId, {
      agentType:  'character',
      memoryType: 'character_event',
      content:    evolution.memory_note,
      importance: 7,
      refs: [{ entity_type: 'character', entity_id: id, label: character.name }],
    });
  }

  eventBus.emit('character:evolved', { projectId, id, evolution });
  res.json({ evolution, character_id: id });
}

export async function suggestRelationshipsHandler(req, res) {
  const { projectId } = req.params;
  const result = await query(
    'SELECT * FROM characters WHERE project_id = $1 AND deleted_at IS NULL',
    [projectId]
  );
  const brainContext = await buildContext(projectId);
  const suggestions = await suggestRelationships({ characters: result.rows, brainContext });
  res.json({ suggestions });
}

export async function deleteCharacter(req, res) {
  const { projectId, id } = req.params;
  // Soft delete
  const result = await query(
    `UPDATE characters SET deleted_at = NOW()
     WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL RETURNING id`,
    [id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Character not found.');
  eventBus.emit('character:deleted', { projectId, id });
  res.json({ deleted: id });
}
