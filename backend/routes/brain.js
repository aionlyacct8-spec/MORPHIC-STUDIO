import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import {
  getBrainHandler, updateSectionHandler, getMemoryHandler, addMemoryHandler
} from '../controllers/brainController.js';

const router = Router({ mergeParams: true }); // inherits :projectId from parent

router.get('/',                          asyncWrap(getBrainHandler));
router.put('/sections/:section',         asyncWrap(updateSectionHandler));
router.patch('/sections/:section',       asyncWrap(updateSectionHandler)); // alias
router.get('/memory',                    asyncWrap(getMemoryHandler));
router.post('/memory',                   asyncWrap(addMemoryHandler));

export default router;
