import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import * as ctrl from '../controllers/productionController.js';

const router = Router({ mergeParams: true });

// Chapters
router.get('/chapters', asyncWrap(ctrl.listChapters));
router.get('/chapters/:id', asyncWrap(ctrl.getChapter));
router.post('/chapters', asyncWrap(ctrl.createChapter));
router.patch('/chapters/:id', asyncWrap(ctrl.updateChapter));
router.delete('/chapters/:id', asyncWrap(ctrl.deleteChapter));

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

// Animation planning / reusable rig assets
router.get('/animation/assets', asyncWrap(ctrl.listAnimationAssets));
router.get('/animation/assets/:id', asyncWrap(ctrl.getAnimationAsset));
router.post('/animation/assets', asyncWrap(ctrl.createAnimationAsset));
router.patch('/animation/assets/:id', asyncWrap(ctrl.updateAnimationAsset));
router.delete('/animation/assets/:id', asyncWrap(ctrl.deleteAnimationAsset));

export default router;
