/**
 * Brain Controller — HTTP handlers for Project Brain endpoints.
 */

import {
  getBrain,
  updateSection, setBrainSection,
  getMemory, appendMemory, searchMemory, expireMemory,
  getBrainVersions, restoreBrainVersion,
  lockBrain, unlockBrain, assertUnlocked,
} from '../services/brainService.js';
import { createError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const log = logger.child('brainController');

// ── Brain ─────────────────────────────────────────────────────────────────────

export async function getBrainHandler(req, res) {
  const { projectId } = req.params;
  const brain = await getBrain(projectId);
  res.json({ brain });
}

export async function updateSectionHandler(req, res) {
  const { projectId, section } = req.params;
  const { data, note } = req.body;

  if (data === undefined) throw createError(400, 'Missing "data" in request body.');

  // Enforce brain lock — throws 409 if an AI generation has locked the brain
  await assertUnlocked(projectId);

  const result = await updateSection(projectId, section, data, { note });
  log.info('Brain section updated via API', { projectId, section });
  res.json({ section, data: result, updated: true });
}

export async function setBrainSectionHandler(req, res) {
  const { projectId, section } = req.params;
  const { data, note } = req.body;

  if (data === undefined) throw createError(400, 'Missing "data" in request body.');

  // Enforce brain lock — throws 409 if an AI generation has locked the brain
  await assertUnlocked(projectId);

  const result = await setBrainSection(projectId, section, data, { note });
  log.info('Brain section replaced via API', { projectId, section });
  res.json({ section, data: result, replaced: true });
}

// ── Memory ────────────────────────────────────────────────────────────────────

export async function getMemoryHandler(req, res) {
  const { projectId } = req.params;
  const { agent_type, min_importance, limit = 50, offset = 0 } = req.query;

  const memories = await getMemory(projectId, {
    agentType:     agent_type,
    minImportance: parseInt(min_importance, 10) || 1,
    limit:         Math.min(parseInt(limit, 10)  || 50, 200),
    offset:        parseInt(offset, 10) || 0,
  });

  res.json({ memories, count: memories.length });
}

export async function addMemoryHandler(req, res) {
  const { projectId } = req.params;
  const { agent_type, memory_type, content, importance, refs } = req.body;

  if (!agent_type || !memory_type || !content) {
    throw createError(400, 'Required: agent_type, memory_type, content');
  }

  await appendMemory(projectId, {
    agentType:  agent_type,
    memoryType: memory_type,
    content,
    importance: importance ?? 5,
    refs:       refs ?? [],
  });

  res.status(201).json({ stored: true });
}

export async function searchMemoryHandler(req, res) {
  const { projectId } = req.params;
  const { q, limit = 20 } = req.query;

  if (!q) throw createError(400, 'Query param "q" is required.');

  const memories = await searchMemory(projectId, q, { limit: parseInt(limit, 10) });
  res.json({ memories, count: memories.length, query: q });
}

export async function expireMemoryHandler(req, res) {
  const { projectId } = req.params;
  const { max_importance = 3, older_than_days = 30 } = req.body;

  const count = await expireMemory(projectId, {
    maxImportance:  parseInt(max_importance, 10),
    olderThanDays:  parseInt(older_than_days, 10),
  });

  res.json({ expired: count });
}

// ── Version history ───────────────────────────────────────────────────────────

export async function getBrainVersionsHandler(req, res) {
  const { projectId } = req.params;
  const { limit = 20 } = req.query;

  const versions = await getBrainVersions(projectId, parseInt(limit, 10));
  res.json({ versions, count: versions.length });
}

export async function restoreBrainVersionHandler(req, res) {
  const { projectId, versionNum } = req.params;

  const result = await restoreBrainVersion(projectId, parseInt(versionNum, 10));
  log.info('Brain restored to version', { projectId, versionNum });
  res.json(result);
}

// ── Locking ───────────────────────────────────────────────────────────────────

export async function lockBrainHandler(req, res) {
  const { projectId } = req.params;
  const { reason } = req.body;

  await lockBrain(projectId, reason);
  res.json({ locked: true, reason: reason ?? 'AI generation in progress' });
}

export async function unlockBrainHandler(req, res) {
  const { projectId } = req.params;
  await unlockBrain(projectId);
  res.json({ locked: false });
}
