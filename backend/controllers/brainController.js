import { getBrain, updateSection, setBrainSection, getMemory, appendMemory } from '../services/brainService.js';
import { createError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const log = logger.child('brainController');

export async function getBrainHandler(req, res) {
  const { projectId } = req.params;
  const brain = await getBrain(projectId);
  res.json({ brain });
}

export async function updateSectionHandler(req, res) {
  const { projectId, section } = req.params;
  const { data, replace } = req.body;

  if (!data) throw createError(400, 'Missing "data" in request body.');

  const result = replace
    ? await setBrainSection(projectId, section, data)
    : await updateSection(projectId, section, data);

  log.info('Brain section updated via API', { projectId, section });
  res.json({ section, data: result, updated: true });
}

export async function getMemoryHandler(req, res) {
  const { projectId } = req.params;
  const { agent_type, min_importance, limit } = req.query;

  const memories = await getMemory(projectId, {
    agentType: agent_type,
    minImportance: parseInt(min_importance) || 1,
    limit: parseInt(limit) || 50,
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
    agentType: agent_type,
    memoryType: memory_type,
    content,
    importance: importance ?? 5,
    refs: refs ?? [],
  });

  res.status(201).json({ stored: true });
}
