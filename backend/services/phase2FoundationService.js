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

const CHARACTER_LIBRARY_ASSET_LINK_GROUPS = {
  sharedAssets: ['reference', 'profile_reference', 'production_reference', 'character_art', 'prop_reference'],
  accessories: ['accessory', 'accessory_reference'],
  turnaroundSheets: ['turnaround', 'turnaround_sheet', 'model_sheet'],
  facialExpressionAssets: ['facial_expression', 'expression_sheet', 'mouth_chart'],
  animationPresets: ['animation_preset', 'motion_preset', 'walk_cycle', 'run_cycle'],
  colorPaletteAssets: ['color_palette', 'palette_reference'],
  voiceAssets: ['voice', 'voice_reference', 'voice_sample'],
};

const SCENE_BUILDER_PLACEMENT_GROUPS = {
  characters: ['character', 'actor', 'performer'],
  props: ['prop', 'set_dressing', 'interactive_prop'],
  environments: ['environment', 'background', 'location', 'set'],
  lighting: ['lighting', 'light', 'shadow', 'atmosphere'],
  cameras: ['camera', 'camera_preset', 'shot', 'framing'],
  weather: ['weather', 'weather_effect'],
  effects: ['effect', 'vfx', 'sfx_visual', 'particle'],
};

function groupAssetLinks(assetLinks = []) {
  const grouped = Object.fromEntries(Object.keys(CHARACTER_LIBRARY_ASSET_LINK_GROUPS).map(key => [key, []]));
  for (const link of assetLinks) {
    for (const [group, types] of Object.entries(CHARACTER_LIBRARY_ASSET_LINK_GROUPS)) {
      if (types.includes(link.link_type)) grouped[group].push(link);
    }
  }
  return grouped;
}

function groupScenePlacements(placements = []) {
  const grouped = Object.fromEntries(Object.keys(SCENE_BUILDER_PLACEMENT_GROUPS).map(key => [key, []]));
  for (const placement of placements) {
    for (const [group, types] of Object.entries(SCENE_BUILDER_PLACEMENT_GROUPS)) {
      if (types.includes(placement.placement_type)) grouped[group].push(placement);
    }
  }
  return grouped;
}

async function assertProjectReferences(projectId, payload) {
  for (const [field, table] of Object.entries(PROJECT_SCOPED_REFERENCES)) {
    if (!payload[field]) continue;
    const result = await query(`SELECT 1 FROM ${table} WHERE id = $1 AND project_id = $2`, [payload[field], projectId]);
    if (!result.rows.length) throw createError(400, `${field} does not belong to this project.`);
  }
}

async function assertRecordScope(configKey, projectId, id, scope = {}) {
  const scopedFields = Object.keys(scope).filter(field => scope[field] !== undefined && repo.PHASE2_TABLES[configKey].insert.includes(field));
  if (!scopedFields.length) return;

  const clauses = scopedFields.map((field, index) => `${field} = $${index + 3}`).join(' AND ');
  const values = [id, projectId, ...scopedFields.map(field => scope[field])];
  const result = await query(
    `SELECT 1 FROM ${repo.PHASE2_TABLES[configKey].table}
     WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL AND ${clauses}`,
    values
  );
  if (!result.rows.length) throw createError(404, 'Phase 2 record not found.');
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

export async function getCharacterLibraryProfile(projectId, characterId) {
  const characterResult = await query(
    'SELECT * FROM characters WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
    [characterId, projectId]
  );
  const character = characterResult.rows[0];
  if (!character) throw createError(404, 'Character not found.');

  const [assetLinks, rigs, expressions, poses, clothingSets] = await Promise.all([
    repo.listPhase2Records('characterAssetLinks', projectId, { character_id: characterId, limit: 200 }),
    repo.listPhase2Records('characterRigs', projectId, { character_id: characterId, limit: 200 }),
    repo.listPhase2Records('characterExpressions', projectId, { character_id: characterId, limit: 200 }),
    repo.listPhase2Records('characterPoses', projectId, { character_id: characterId, limit: 200 }),
    repo.listPhase2Records('characterClothingSets', projectId, { character_id: characterId, limit: 200 }),
  ]);

  const linkedAssetIds = assetLinks.assetLinks.map(link => link.asset_id).filter(Boolean);
  let linkedAssets = [];
  if (linkedAssetIds.length) {
    const assetResult = await query(
      `SELECT * FROM assets
       WHERE project_id = $1 AND deleted_at IS NULL AND id = ANY($2::uuid[])
       ORDER BY name ASC`,
      [projectId, linkedAssetIds]
    );
    linkedAssets = assetResult.rows;
  }

  const groupedAssetLinks = groupAssetLinks(assetLinks.assetLinks);

  return {
    character,
    assetLinks: assetLinks.assetLinks,
    groupedAssetLinks,
    linkedAssets,
    assetVersions: assetLinks.assetLinks.filter(link => link.asset_version_id),
    rigs: rigs.rigs,
    expressions: expressions.expressions,
    poseLibrary: poses.poses,
    poses: poses.poses,
    clothingSets: clothingSets.clothingSets,
    accessories: groupedAssetLinks.accessories,
    turnaroundSheets: groupedAssetLinks.turnaroundSheets,
    facialExpressionLibrary: expressions.expressions,
    facialExpressionAssets: groupedAssetLinks.facialExpressionAssets,
    animationPresets: groupedAssetLinks.animationPresets,
    colorPalette: character.visual_dna?.color_palette ?? character.visual_dna?.palette ?? [],
    colorPaletteAssets: groupedAssetLinks.colorPaletteAssets,
    voiceProfile: character.voice_profile ?? {},
    voiceAssets: groupedAssetLinks.voiceAssets,
    metadata: {
      visualDna: character.visual_dna ?? {},
      personality: character.personality ?? {},
      relationships: character.relationships ?? [],
      outfitHistory: character.outfit_history ?? [],
      status: character.status,
      arcProgress: character.arc_progress,
    },
    productionNotes: character.notes ?? '',
    summary: {
      assetLinks: assetLinks.total,
      linkedAssets: linkedAssets.length,
      assetVersions: assetLinks.assetLinks.filter(link => link.asset_version_id).length,
      rigs: rigs.total,
      expressions: expressions.total,
      poses: poses.total,
      clothingSets: clothingSets.total,
      accessories: groupedAssetLinks.accessories.length,
      turnaroundSheets: groupedAssetLinks.turnaroundSheets.length,
      facialExpressionAssets: groupedAssetLinks.facialExpressionAssets.length,
      animationPresets: groupedAssetLinks.animationPresets.length,
      voiceAssets: groupedAssetLinks.voiceAssets.length,
    },
  };
}

export async function getSceneBuilderProfile(projectId, sceneId) {
  const sceneResult = await query(
    'SELECT * FROM scenes WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL',
    [sceneId, projectId]
  );
  const scene = sceneResult.rows[0];
  if (!scene) throw createError(404, 'Scene not found.');

  const placements = await repo.listPhase2Records('scenePlacements', projectId, { scene_id: sceneId, limit: 200 });
  const groupedPlacements = groupScenePlacements(placements.placements);

  const assetIds = placements.placements.map(placement => placement.asset_id).filter(Boolean);
  let linkedAssets = [];
  if (assetIds.length) {
    const assetResult = await query(
      `SELECT * FROM assets
       WHERE project_id = $1 AND deleted_at IS NULL AND id = ANY($2::uuid[])
       ORDER BY name ASC`,
      [projectId, assetIds]
    );
    linkedAssets = assetResult.rows;
  }

  const characterIds = placements.placements.map(placement => placement.character_id).filter(Boolean);
  let characters = [];
  if (characterIds.length) {
    const characterResult = await query(
      `SELECT * FROM characters
       WHERE project_id = $1 AND deleted_at IS NULL AND id = ANY($2::uuid[])
       ORDER BY name ASC`,
      [projectId, characterIds]
    );
    characters = characterResult.rows;
  }

  const metadata = scene.metadata ?? {};
  return {
    scene,
    placements: placements.placements,
    groupedPlacements,
    characters,
    props: groupedPlacements.props,
    environments: groupedPlacements.environments,
    lighting: metadata.lighting ?? groupedPlacements.lighting,
    camera: metadata.camera ?? groupedPlacements.cameras,
    weather: scene.weather ?? metadata.weather ?? groupedPlacements.weather,
    effects: metadata.effects ?? groupedPlacements.effects,
    linkedAssets,
    assetVersions: placements.placements.filter(placement => placement.asset_version_id),
    metadata: {
      mood: scene.mood,
      timeOfDay: scene.time_of_day,
      durationEstimate: scene.duration_est,
      sceneMetadata: metadata,
    },
    productionNotes: metadata.production_notes ?? '',
    summary: {
      placements: placements.total,
      linkedAssets: linkedAssets.length,
      assetVersions: placements.placements.filter(placement => placement.asset_version_id).length,
      characters: groupedPlacements.characters.length,
      props: groupedPlacements.props.length,
      environments: groupedPlacements.environments.length,
      lighting: groupedPlacements.lighting.length,
      cameras: groupedPlacements.cameras.length,
      weather: groupedPlacements.weather.length,
      effects: groupedPlacements.effects.length,
    },
  };
}

export async function listRecords(configKey, projectId, filters) {
  return repo.listPhase2Records(configKey, projectId, filters);
}

export async function createRecord(configKey, projectId, payload) {
  requireFields(configKey, payload);
  await assertProjectReferences(projectId, payload);
  return repo.createPhase2Record(configKey, projectId, payload);
}

export async function updateRecord(configKey, projectId, id, payload) {
  await assertRecordScope(configKey, projectId, id, payload);
  await assertProjectReferences(projectId, payload);
  const record = await repo.updatePhase2Record(configKey, projectId, id, payload);
  if (!record) throw createError(404, 'Phase 2 record not found or no editable fields supplied.');
  return { [repo.PHASE2_TABLES[configKey].collection.slice(0, -1) || 'record']: record, record };
}

export async function getRecord(configKey, projectId, id) {
  const record = await repo.getPhase2Record(configKey, projectId, id);
  if (!record) throw createError(404, 'Phase 2 record not found.');
  return { record };
}

export async function deleteRecord(configKey, projectId, id, scope = {}) {
  await assertRecordScope(configKey, projectId, id, scope);
  const deleted = await repo.deletePhase2Record(configKey, projectId, id);
  if (!deleted) throw createError(404, 'Phase 2 record not found.');
  return { deleted };
}
