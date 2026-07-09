import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import * as ctrl from '../controllers/productionController.js';
import * as phase2 from '../controllers/phase2FoundationController.js';

const router = Router({ mergeParams: true });

// Phase 1 story intake / production planning
router.post('/intake/plan', asyncWrap(ctrl.planStoryIntake));
// Phase 2 AI-enhanced story intake
router.post('/intake/enhance', asyncWrap(ctrl.enhanceStoryIntake));
// Chapters
router.get('/chapters', asyncWrap(ctrl.listChapters));
router.get('/chapters/:id', asyncWrap(ctrl.getChapter));
router.post('/chapters', asyncWrap(ctrl.createChapter));
router.patch('/chapters/:id', asyncWrap(ctrl.updateChapter));
router.delete('/chapters/:id', asyncWrap(ctrl.deleteChapter));


// Phase 2B-D reusable production foundations
router.get('/characters/:characterId/library', asyncWrap(phase2.getCharacterLibraryProfile));
router.get('/characters/:characterId/asset-links', asyncWrap(phase2.listCharacterAssetLinks));
router.post('/characters/:characterId/asset-links', asyncWrap(phase2.createCharacterAssetLink));
router.patch('/characters/:characterId/asset-links/:id', asyncWrap(phase2.updateCharacterAssetLink));
router.delete('/characters/:characterId/asset-links/:id', asyncWrap(phase2.deleteCharacterAssetLink));
router.get('/characters/:characterId/rigs', asyncWrap(phase2.listCharacterRigs));
router.post('/characters/:characterId/rigs', asyncWrap(phase2.createCharacterRig));
router.patch('/characters/:characterId/rigs/:id', asyncWrap(phase2.updateCharacterRig));
router.delete('/characters/:characterId/rigs/:id', asyncWrap(phase2.deleteCharacterRig));
router.get('/characters/:characterId/expressions', asyncWrap(phase2.listCharacterExpressions));
router.post('/characters/:characterId/expressions', asyncWrap(phase2.createCharacterExpression));
router.patch('/characters/:characterId/expressions/:id', asyncWrap(phase2.updateCharacterExpression));
router.delete('/characters/:characterId/expressions/:id', asyncWrap(phase2.deleteCharacterExpression));
router.get('/characters/:characterId/poses', asyncWrap(phase2.listCharacterPoses));
router.post('/characters/:characterId/poses', asyncWrap(phase2.createCharacterPose));
router.patch('/characters/:characterId/poses/:id', asyncWrap(phase2.updateCharacterPose));
router.delete('/characters/:characterId/poses/:id', asyncWrap(phase2.deleteCharacterPose));
router.get('/characters/:characterId/clothing-sets', asyncWrap(phase2.listCharacterClothingSets));
router.post('/characters/:characterId/clothing-sets', asyncWrap(phase2.createCharacterClothingSet));
router.patch('/characters/:characterId/clothing-sets/:id', asyncWrap(phase2.updateCharacterClothingSet));
router.delete('/characters/:characterId/clothing-sets/:id', asyncWrap(phase2.deleteCharacterClothingSet));
router.get('/scenes/:sceneId/builder', asyncWrap(phase2.getSceneBuilderProfile));
router.get('/scenes/:sceneId/placements', asyncWrap(phase2.listScenePlacements));
router.post('/scenes/:sceneId/placements', asyncWrap(phase2.createScenePlacement));
router.patch('/scenes/:sceneId/placements/:id', asyncWrap(phase2.updateScenePlacement));
router.delete('/scenes/:sceneId/placements/:id', asyncWrap(phase2.deleteScenePlacement));
router.get('/storyboards/asset-references', asyncWrap(phase2.listStoryboardAssetReferences));
router.post('/storyboards/asset-references', asyncWrap(phase2.createStoryboardAssetReference));

// Comic pages and panels
router.get('/comic/pages', asyncWrap(ctrl.listComicPages));
router.get('/comic/pages/:id', asyncWrap(ctrl.getComicPage));
router.post('/comic/pages', asyncWrap(ctrl.createComicPage));
router.patch('/comic/pages/:id', asyncWrap(ctrl.updateComicPage));
router.delete('/comic/pages/:id', asyncWrap(ctrl.deleteComicPage));

router.get('/comic/panels', asyncWrap(ctrl.listComicPanels));
router.get('/comic/panels/:id', asyncWrap(ctrl.getComicPanel));
router.post('/comic/panels', asyncWrap(ctrl.createComicPanel));
router.patch('/comic/panels/:id', asyncWrap(ctrl.updateComicPanel));
router.delete('/comic/panels/:id', asyncWrap(ctrl.deleteComicPanel));



// Phase 2E comic layout / lettering foundation
router.get('/comic/speech-bubbles', asyncWrap(phase2.listComicSpeechBubbles));
router.post('/comic/speech-bubbles', asyncWrap(phase2.createComicSpeechBubble));

// Workflow stages
router.get('/workflow/stages', asyncWrap(ctrl.listWorkflowStages));
router.patch('/workflow/stages/:stageKey', asyncWrap(ctrl.updateWorkflowStage));

// Voices
router.get('/voices', asyncWrap(ctrl.listVoiceProfiles));
router.get('/voices/:id', asyncWrap(ctrl.getVoiceProfile));
router.post('/voices', asyncWrap(ctrl.createVoiceProfile));
router.patch('/voices/:id', asyncWrap(ctrl.updateVoiceProfile));
router.delete('/voices/:id', asyncWrap(ctrl.deleteVoiceProfile));

// Motion comics / slideshow production
router.get('/motion/sequences', asyncWrap(ctrl.listMotionSequences));
router.get('/motion/sequences/:id', asyncWrap(ctrl.getMotionSequence));
router.post('/motion/sequences', asyncWrap(ctrl.createMotionSequence));
router.patch('/motion/sequences/:id', asyncWrap(ctrl.updateMotionSequence));
router.delete('/motion/sequences/:id', asyncWrap(ctrl.deleteMotionSequence));
router.post('/motion/sequences/:sequenceId/cues', asyncWrap(ctrl.createMotionCue));
router.patch('/motion/cues/:cueId', asyncWrap(ctrl.updateMotionCue));
router.delete('/motion/cues/:cueId', asyncWrap(ctrl.deleteMotionCue));


// Phase 2F animation timeline foundation
router.get('/animation/timelines', asyncWrap(phase2.listAnimationTimelines));
router.post('/animation/timelines', asyncWrap(phase2.createAnimationTimeline));
router.get('/animation/timelines/:timelineId/keyframes', asyncWrap(phase2.listAnimationKeyframes));
router.post('/animation/timelines/:timelineId/keyframes', asyncWrap(phase2.createAnimationKeyframe));

// Animation planning / reusable rig assets
router.get('/animation/assets', asyncWrap(ctrl.listAnimationAssets));
router.get('/animation/assets/:id', asyncWrap(ctrl.getAnimationAsset));
router.post('/animation/assets', asyncWrap(ctrl.createAnimationAsset));
router.patch('/animation/assets/:id', asyncWrap(ctrl.updateAnimationAsset));
router.delete('/animation/assets/:id', asyncWrap(ctrl.deleteAnimationAsset));

export default router;
