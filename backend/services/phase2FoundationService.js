import { createError } from '../middleware/errorHandler.js';
import { query } from './db.js';
import * as repo from '../repositories/phase2Repository.js';


const PROJECT_SCOPED_REFERENCES = {
  character_id: 'characters',
  asset_id: 'assets',
  asset_version_id: 'asset_versions',
  scene_id: 'scenes',
  storyboard_id: 'storyboards',
  page_id: 'comic_pages',
  panel_id: 'comic_panels',
  rig_id: 'character_rigs',
  timeline_id: 'animation_timelines',
};

async function assertProjectReferences(projectId, payload) {
  for (const [field, table] of Object.entries(PROJECT_SCOPED_REFERENCES)) {
    if (!payload[field]) continue;
    const result = await query(`SELECT 1 FROM ${table} WHERE id = $1 AND project_id = $2`, [payload[field], projectId]);
    if (!result.rows.length) throw createError(400, `${field} does not belong to this project.`);
  }
}

function requireFields(configKey, payload) {
  const config = repo.PHASE2_TABLES[configKey];
  for (const field of config.required) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw createError(400, `${field} is required.`);
    }
  }

  if (configKey === 'storyboardAssetReferences' && !payload.storyboard_id && !payload.page_id && !payload.panel_id) {
    throw createError(400, 'storyboard_id, page_id, or panel_id is required.');
  }

  if (configKey === 'comicSpeechBubbles' && !payload.page_id && !payload.panel_id) {
    throw createError(400, 'page_id or panel_id is required.');
  }
}

export async function listRecords(configKey, projectId, filters) {
  return repo.listPhase2Records(configKey, projectId, filters);
}

export async function createRecord(configKey, projectId, payload) {
  requireFields(configKey, payload);
  await assertProjectReferences(projectId, payload);
  return repo.createPhase2Record(configKey, projectId, payload);
}

export async function getRecord(configKey, projectId, id) {
  const record = await repo.getPhase2Record(configKey, projectId, id);
  if (!record) throw createError(404, 'Phase 2 record not found.');
  return { record };
}

export async function deleteRecord(configKey, projectId, id) {
  const deleted = await repo.deletePhase2Record(configKey, projectId, id);
  if (!deleted) throw createError(404, 'Phase 2 record not found.');
  return { deleted };
}
