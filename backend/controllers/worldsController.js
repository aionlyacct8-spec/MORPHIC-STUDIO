import { query } from '../services/db.js';
import { buildContext, appendMemory } from '../services/brainService.js';
import { generateWorldBible, generateLocation } from '../agents/worldAgent.js';
import { createError } from '../middleware/errorHandler.js';
import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';

const log = logger.child('worldsController');

// ── Worlds ────────────────────────────────────────────────

export async function listWorlds(req, res) {
  const { projectId } = req.params;
  const result = await query('SELECT * FROM worlds WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
  res.json({ worlds: result.rows });
}

export async function getWorld(req, res) {
  const { projectId, id } = req.params;
  const world = await query(
    'SELECT * FROM worlds WHERE id = $1 AND project_id = $2',
    [id, projectId]
  );
  if (!world.rows.length) throw createError(404, 'World not found.');

  const locations = await query('SELECT * FROM locations WHERE world_id = $1 ORDER BY created_at ASC', [id]);
  res.json({ world: world.rows[0], locations: locations.rows });
}

export async function createWorld(req, res) {
  const { projectId } = req.params;
  const { name, description, era, type, generateAI } = req.body;
  if (!name) throw createError(400, 'World name is required.');

  let rules = req.body.rules ?? [];
  let atmosphere = req.body.atmosphere ?? {};
  let history = req.body.history ?? [];

  if (generateAI) {
    log.info('Generating world bible via AI', { name });
    const brainContext = await buildContext(projectId);
    const proj = await query('SELECT genre FROM projects WHERE id = $1', [projectId]);
    const bible = await generateWorldBible({
      name, premise: description ?? '',
      genre: proj.rows[0]?.genre ?? '', era: era ?? '',
      brainContext,
    });
    rules = bible.rules ?? rules;
    atmosphere = bible.atmosphere ?? atmosphere;
    history = bible.history ?? history;
  }

  const result = await query(
    `INSERT INTO worlds (project_id, name, description, era, type, rules, atmosphere, history)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [projectId, name, description, era, type ?? 'fictional',
     JSON.stringify(rules), JSON.stringify(atmosphere), JSON.stringify(history)]
  );
  const world = result.rows[0];

  await appendMemory(projectId, {
    agentType: 'world', memoryType: 'world_event',
    content: `World "${name}" added to the project.`,
    importance: 6,
    refs: [{ entity_type: 'world', entity_id: world.id, label: name }],
  });

  eventBus.emit('world:created', { projectId, world });
  log.info('World created', { id: world.id, name });
  res.status(201).json({ world });
}

export async function updateWorld(req, res) {
  const { projectId, id } = req.params;
  const { name, description, era, type, rules, atmosphere, history } = req.body;

  const result = await query(
    `UPDATE worlds SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       era = COALESCE($3, era),
       type = COALESCE($4, type),
       rules = COALESCE($5, rules),
       atmosphere = COALESCE($6, atmosphere),
       history = COALESCE($7, history),
       updated_at = NOW()
     WHERE id = $8 AND project_id = $9 RETURNING *`,
    [name, description, era, type,
     rules ? JSON.stringify(rules) : null,
     atmosphere ? JSON.stringify(atmosphere) : null,
     history ? JSON.stringify(history) : null,
     id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'World not found.');
  res.json({ world: result.rows[0] });
}

// ── Locations ─────────────────────────────────────────────

export async function listLocations(req, res) {
  const { projectId } = req.params;
  const result = await query('SELECT * FROM locations WHERE project_id = $1 ORDER BY created_at ASC', [projectId]);
  res.json({ locations: result.rows });
}

export async function createLocation(req, res) {
  const { projectId, worldId } = req.params;
  const { name, type, description, generateAI } = req.body;
  if (!name) throw createError(400, 'Location name is required.');

  let atmosphere = req.body.atmosphere ?? {};
  let visual_preset = req.body.visual_preset ?? {};

  if (generateAI) {
    log.info('Generating location via AI', { name });
    const brainContext = await buildContext(projectId);
    const worldResult = await query('SELECT * FROM worlds WHERE id = $1', [worldId]);
    const worldCtx = worldResult.rows[0] ? `${worldResult.rows[0].name}: ${worldResult.rows[0].description}` : '';
    const loc = await generateLocation({ name, type: type ?? 'building', worldContext: worldCtx, brainContext });
    atmosphere = loc.atmosphere ?? atmosphere;
    visual_preset = loc.visual_preset ?? visual_preset;
  }

  const result = await query(
    `INSERT INTO locations (world_id, project_id, name, type, description, atmosphere, visual_preset)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [worldId, projectId, name, type, description,
     JSON.stringify(atmosphere), JSON.stringify(visual_preset)]
  );

  eventBus.emit('location:created', { projectId, worldId, location: result.rows[0] });
  log.info('Location created', { name });
  res.status(201).json({ location: result.rows[0] });
}

export async function updateLocation(req, res) {
  const { projectId, id } = req.params;
  const { name, type, description, atmosphere, visual_preset } = req.body;

  const result = await query(
    `UPDATE locations SET
       name = COALESCE($1, name),
       type = COALESCE($2, type),
       description = COALESCE($3, description),
       atmosphere = COALESCE($4, atmosphere),
       visual_preset = COALESCE($5, visual_preset)
     WHERE id = $6 AND project_id = $7 RETURNING *`,
    [name, type, description,
     atmosphere ? JSON.stringify(atmosphere) : null,
     visual_preset ? JSON.stringify(visual_preset) : null,
     id, projectId]
  );
  if (!result.rows.length) throw createError(404, 'Location not found.');
  res.json({ location: result.rows[0] });
}
