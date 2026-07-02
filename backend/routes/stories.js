import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import {
  listScripts, getScript, createScript, updateScript,
  analyzeScriptHandler, generateOutlineHandler
} from '../controllers/storiesController.js';

const router = Router({ mergeParams: true }); // inherits :projectId

// Outline (no script needed)
router.post('/outline',                      asyncWrap(generateOutlineHandler));

// Scripts
router.get('/scripts',                       asyncWrap(listScripts));
router.get('/scripts/:scriptId',             asyncWrap(getScript));
router.post('/scripts',                      asyncWrap(createScript));
router.patch('/scripts/:scriptId',           asyncWrap(updateScript));

// AI Analysis → storyboard
router.post('/scripts/:scriptId/analyze',    asyncWrap(analyzeScriptHandler));

export default router;
