import { query } from '../services/db.js';
import { getBrain } from '../services/brainService.js';
import { createError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const log = logger.child('projectsController');

export async function listProjects(req, res) {
  const result = await query(
    'SELECT * FROM projects ORDER BY updated_at DESC'
  );
  res.json({ projects: result.rows });
}

export async function getProject(req, res) {
  const { id } = req.params;
  const proj = await query('SELECT * FROM projects WHERE id = $1', [id]);
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
  await query(
    `INSERT INTO project_brain (project_id) VALUES ($1)`,
    [project.id]
  );

  log.info('Project created', { id: project.id, title });
  res.status(201).json({ project });
}

export async function updateProject(req, res) {
  const { id } = req.params;
  const { title, description, genre, format, style, status } = req.body;

  const result = await query(
    `UPDATE projects
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         genre = COALESCE($3, genre),
         format = COALESCE($4, format),
         style = COALESCE($5, style),
         status = COALESCE($6, status),
         updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [title, description, genre, format, style, status, id]
  );
  if (!result.rows.length) throw createError(404, 'Project not found.');

  res.json({ project: result.rows[0] });
}

export async function deleteProject(req, res) {
  const { id } = req.params;
  const result = await query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
  if (!result.rows.length) throw createError(404, 'Project not found.');
  res.json({ deleted: id });
}
