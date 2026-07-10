import * as service from '../services/phase2FoundationService.js';
import eventBus from '../services/eventBus.js';

function withParams(req, extra = {}) {
  return { ...req.body, ...extra };
}

async function list(req, res, key, extraFilters = {}) {
  const result = await service.listRecords(key, req.params.projectId, { ...req.query, ...extraFilters });
  res.json(result);
}

async function create(req, res, key, extra = {}) {
  const result = await service.createRecord(key, req.params.projectId, withParams(req, extra));
  eventBus.emit('phase2:record_created', { projectId: req.params.projectId, key, record: result.record });
  res.status(201).json(result);
}

async function update(req, res, key, extra = {}) {
  const result = await service.updateRecord(key, req.params.projectId, req.params.id, withParams(req, extra));
  eventBus.emit('phase2:record_updated', { projectId: req.params.projectId, key, record: result.record });
  res.json(result);
}

async function remove(req, res, key, extra = {}) {
  const result = await service.deleteRecord(key, req.params.projectId, req.params.id, extra);
  eventBus.emit('phase2:record_deleted', { projectId: req.params.projectId, key, id: result.deleted });
  res.json(result);
}

export const listCharacterAssetLinks = (req, res) => list(req, res, 'characterAssetLinks', { character_id: req.params.characterId });
export const createCharacterAssetLink = (req, res) => create(req, res, 'characterAssetLinks', { character_id: req.params.characterId });
export const updateCharacterAssetLink = (req, res) => update(req, res, 'characterAssetLinks', { character_id: req.params.characterId });
export const deleteCharacterAssetLink = (req, res) => remove(req, res, 'characterAssetLinks', { character_id: req.params.characterId });
export const listCharacterRigs = (req, res) => list(req, res, 'characterRigs', { character_id: req.params.characterId });
export const createCharacterRig = (req, res) => create(req, res, 'characterRigs', { character_id: req.params.characterId });
export const updateCharacterRig = (req, res) => update(req, res, 'characterRigs', { character_id: req.params.characterId });
export const deleteCharacterRig = (req, res) => remove(req, res, 'characterRigs', { character_id: req.params.characterId });
export const listCharacterExpressions = (req, res) => list(req, res, 'characterExpressions', { character_id: req.params.characterId });
export const createCharacterExpression = (req, res) => create(req, res, 'characterExpressions', { character_id: req.params.characterId });
export const updateCharacterExpression = (req, res) => update(req, res, 'characterExpressions', { character_id: req.params.characterId });
export const deleteCharacterExpression = (req, res) => remove(req, res, 'characterExpressions', { character_id: req.params.characterId });
export const listCharacterPoses = (req, res) => list(req, res, 'characterPoses', { character_id: req.params.characterId });
export const createCharacterPose = (req, res) => create(req, res, 'characterPoses', { character_id: req.params.characterId });
export const updateCharacterPose = (req, res) => update(req, res, 'characterPoses', { character_id: req.params.characterId });
export const deleteCharacterPose = (req, res) => remove(req, res, 'characterPoses', { character_id: req.params.characterId });
export const listCharacterClothingSets = (req, res) => list(req, res, 'characterClothingSets', { character_id: req.params.characterId });
export const createCharacterClothingSet = (req, res) => create(req, res, 'characterClothingSets', { character_id: req.params.characterId });
export const updateCharacterClothingSet = (req, res) => update(req, res, 'characterClothingSets', { character_id: req.params.characterId });
export const deleteCharacterClothingSet = (req, res) => remove(req, res, 'characterClothingSets', { character_id: req.params.characterId });

export async function getCharacterLibraryProfile(req, res) {
  const { projectId, characterId } = req.params;
  const profile = await service.getCharacterLibraryProfile(projectId, characterId);
  res.json({ characterLibrary: profile });
}

export async function getSceneBuilderProfile(req, res) {
  const { projectId, sceneId } = req.params;
  const profile = await service.getSceneBuilderProfile(projectId, sceneId);
  res.json({ sceneBuilder: profile });
}

export const listScenePlacements = (req, res) => list(req, res, 'scenePlacements', { scene_id: req.params.sceneId });
export const createScenePlacement = (req, res) => create(req, res, 'scenePlacements', { scene_id: req.params.sceneId });
export const updateScenePlacement = (req, res) => update(req, res, 'scenePlacements', { scene_id: req.params.sceneId });
export const deleteScenePlacement = (req, res) => remove(req, res, 'scenePlacements', { scene_id: req.params.sceneId });

export const listStoryboardAssetReferences = (req, res) => list(req, res, 'storyboardAssetReferences');
export const createStoryboardAssetReference = (req, res) => create(req, res, 'storyboardAssetReferences');

export const listComicSpeechBubbles = (req, res) => list(req, res, 'comicSpeechBubbles');
export const createComicSpeechBubble = (req, res) => create(req, res, 'comicSpeechBubbles');

export const listAnimationTimelines = (req, res) => list(req, res, 'animationTimelines');
export const createAnimationTimeline = (req, res) => create(req, res, 'animationTimelines');
export const listAnimationKeyframes = (req, res) => list(req, res, 'animationKeyframes', { timeline_id: req.params.timelineId });
export const createAnimationKeyframe = (req, res) => create(req, res, 'animationKeyframes', { timeline_id: req.params.timelineId });
