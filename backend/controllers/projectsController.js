/**
 * Projects Controller — with pagination, soft delete, and event emission.
 */

import { query } from '../services/db.js';
import { getBrain } from '../services/brainService.js';
import { createError } from '../middleware/errorHandler.js';
import eventBus from '../services/eventBus.js';
import logger from '../utils/logger.js';

const log = logger.child('projectsController');

function paginate(req) {
  const limit  = Math.min(parseInt(req.query.limit  ?? 50,  10), 200);
  const offset = Math.max(parseInt(req.query.offset ?? 0,   10), 0);
  return { limit, offset };
}

export async function listProjects(req, res) {
  const { limit, offset } = paginate(req);
  const { status, search } = req.query;

  let sql = `SELECT * FROM projects WHERE deleted_at IS NULL`;
  const params = [];
  let i = 1;

  if (status) { sql += ` AND status = $${i++}`;            params.push(status); }
  if (search) { sql += ` AND title ILIKE $${i++}`;         params.push(`%${search}%`); }

  sql += ` ORDER BY updated_at DESC LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const [result, countResult] = await Promise.all([
    query(sql, params),
    query(
      `SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL${status ? ' AND status = $1' : ''}`,
      status ? [status] : []
    ),
  ]);

  res.json({
    projects: result.rows,
    total:    parseInt(countResult.rows[0].count, 10),
    limit,
    offset,
  });
}

export async function getProject(req, res) {
  const { id } = req.params;
  const proj = await query('SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL', [id]);
  if (!proj.rows.length) throw createError(404, 'Project not found.');

  const brain = await getBrain(id);
  res.json({ project: proj.rows[0], brain });
}

export async function createProject(req, res) {
  const { title, description, genre, format, style } = req.body;
  if (!title) throw createError(400, 'Project title is required.');

  const result = await query(
    `INSERT INTO projects (title, description, genre, format, style)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, description, genre, format, style]
  );
  const project = result.rows[0];

  // Auto-initialise the project brain
  await query(`INSERT INTO project_brain (project_id) VALUES ($1)`, [project.id]);

  eventBus.emit('project:created', { projectId: project.id, project });
  log.info('Project created', { id: project.id, title });
  res.status(201).json({ project });
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const { title, description, genre, format, style, status } = req.body;

  const result = await query(
    `UPDATE projects
     SET title       = COALESCE($1, title),
         description = COALESCE($2, description),
         genre       = COALESCE($3, genre),
         format      = COALESCE($4, format),
         style       = COALESCE($5, style),
         status      = COALESCE($6, status),
         updated_at  = NOW()
     WHERE id = $7 AND deleted_at IS NULL RETURNING *`,
    [title, description, genre, format, style, status, id]
  );
  if (!result.rows.length) throw createError(404, 'Project not found.');

  eventBus.emit('project:updated', { projectId: id, changes: req.body });
  res.json({ project: result.rows[0] });
}

export async function deleteProject(req, res) {
  const { id } = req.params;
  // Soft delete
  const result = await query(
    'UPDATE projects SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
    [id]
  );
  if (!result.rows.length) throw createError(404, 'Project not found.');
  eventBus.emit('project:deleted', { projectId: id });
  res.json({ deleted: id });
}
