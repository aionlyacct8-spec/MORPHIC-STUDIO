/**
 * Generation Job Service
 * CRUD operations for the generation_jobs table.
 *
 * generation_jobs remains the legacy physical table for compatibility.
 * production_jobs is a read compatibility view introduced for production
 * automation terminology while orchestrator writes continue to target the
 * legacy table until a full migration is approved.
 * The Orchestrator creates/updates jobs; this service exposes them via API.
 */

import { query } from './db.js';
import { createError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const log = logger.child('generationJobService');

export async function listJobs(projectId, { status, jobType, limit = 50, offset = 0 } = {}) {
  let sql = `SELECT * FROM generation_jobs WHERE project_id = $1`;
  const params = [projectId];
  let i = 2;

  if (status)  { sql += ` AND status = $${i++}`;   params.push(status);  }
  if (jobType) { sql += ` AND job_type = $${i++}`; params.push(jobType); }

  sql += ` ORDER BY created_at DESC LIMIT $${i++} OFFSET $${i}`;
  params.push(limit, offset);

  const res = await query(sql, params);
  const countRes = await query(
    `SELECT COUNT(*) FROM generation_jobs WHERE project_id = $1`,
    [projectId]
  );
  return { jobs: res.rows, total: parseInt(countRes.rows[0].count, 10) };
}

export async function getJob(projectId, jobId) {
  const res = await query(
    `SELECT * FROM generation_jobs WHERE id = $1 AND project_id = $2`,
    [jobId, projectId]
  );
  if (!res.rows.length) throw createError(404, 'Generation job not found.');
  return res.rows[0];
}

export async function cancelJob(projectId, jobId) {
  const res = await query(
    `UPDATE generation_jobs
     SET status = 'cancelled', completed_at = NOW()
     WHERE id = $1 AND project_id = $2 AND status IN ('queued', 'running')
     RETURNING *`,
    [jobId, projectId]
  );
  if (!res.rows.length) throw createError(404, 'Job not found or not cancellable.');
  return res.rows[0];
}

export async function getJobStats(projectId) {
  const res = await query(
    `SELECT
       job_type,
       status,
       COUNT(*)         AS count,
       SUM(tokens_used) AS total_tokens,
       SUM(cost_usd)    AS total_cost_usd,
       AVG(duration_ms) AS avg_duration_ms
     FROM generation_jobs
     WHERE project_id = $1
     GROUP BY job_type, status
     ORDER BY job_type, status`,
    [projectId]
  );

  // Totals
  const totalsRes = await query(
    `SELECT
       COUNT(*)                                            AS total_jobs,
       COUNT(*) FILTER (WHERE status = 'complete')        AS completed,
       COUNT(*) FILTER (WHERE status = 'failed')          AS failed,
       SUM(tokens_used)                                   AS total_tokens,
       COALESCE(SUM(cost_usd), 0)                         AS total_cost_usd
     FROM generation_jobs WHERE project_id = $1`,
    [projectId]
  );

  return { byType: res.rows, totals: totalsRes.rows[0] };
}

export default { listJobs, getJob, cancelJob, getJobStats };
