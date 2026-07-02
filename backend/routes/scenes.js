import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import * as ctrl from '../controllers/scenesController.js';

const router = Router({ mergeParams: true });

// Scenes
router.get('/scenes',           asyncWrap(ctrl.listScenes));
router.get('/scenes/:id',       asyncWrap(ctrl.getScene));
router.post('/scenes',          asyncWrap(ctrl.createScene));
router.patch('/scenes/:id',     asyncWrap(ctrl.updateScene));
router.delete('/scenes/:id',    asyncWrap(ctrl.deleteScene));

// Episodes
router.get('/episodes',         asyncWrap(ctrl.listEpisodes));
router.get('/episodes/:id',     asyncWrap(ctrl.getEpisode));
router.post('/episodes',        asyncWrap(ctrl.createEpisode));
router.patch('/episodes/:id',   asyncWrap(ctrl.updateEpisode));
router.delete('/episodes/:id',  asyncWrap(ctrl.deleteEpisode));

export default router;
