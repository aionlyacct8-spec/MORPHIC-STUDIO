/**
 * Generation Jobs Controller
 */

import * as svc from '../services/generationJobService.js';
import { dispatch } from '../agents/orchestrator.js';
import { createError } from '../middleware/errorHandler.js';

// GET /api/projects/:projectId/jobs
export async function listJobs(req, res) {
  const { projectId } = req.params;
  const { status, type, limit = 50, offset = 0 } = req.query;

  const data = await svc.listJobs(projectId, {
    status,
    jobType: type,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
  res.json(data);
}

// GET /api/projects/:projectId/jobs/stats
export async function getJobStats(req, res) {
  const { projectId } = req.params;
  const stats = await svc.getJobStats(projectId);
  res.json(stats);
}

// GET /api/projects/:projectId/jobs/:jobId
export async function getJob(req, res) {
  const { projectId, jobId } = req.params;
  const job = await svc.getJob(projectId, jobId);
  res.json({ job });
}

// DELETE /api/projects/:projectId/jobs/:jobId
export async function cancelJob(req, res) {
  const { projectId, jobId } = req.params;
  const job = await svc.cancelJob(projectId, jobId);
  res.json({ job });
}

// POST /api/projects/:projectId/jobs/dispatch
// Body: { taskType, input, useCache }
export async function dispatchJob(req, res) {
  const { projectId } = req.params;
  const { taskType, input = {}, useCache = true } = req.body;

  if (!taskType) throw createError(400, 'taskType is required.');

  const result = await dispatch({ projectId, taskType, input, useCache });
  res.status(202).json({
    jobId:     result.jobId,
    agentName: result.agentName,
    fromCache: result.fromCache,
    durationMs: result.durationMs,
    result:    result.result,
  });
}
