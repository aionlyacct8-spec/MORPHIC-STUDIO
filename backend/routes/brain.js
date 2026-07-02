import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import {
  getBrainHandler, updateSectionHandler, setBrainSectionHandler,
  getMemoryHandler, addMemoryHandler, searchMemoryHandler,
  getBrainVersionsHandler, restoreBrainVersionHandler,
  lockBrainHandler, unlockBrainHandler,
  expireMemoryHandler,
} from '../controllers/brainController.js';

const router = Router({ mergeParams: true }); // inherits :projectId from parent

// Brain read / write
router.get('/',                           asyncWrap(getBrainHandler));
router.put('/sections/:section',          asyncWrap(updateSectionHandler));
router.patch('/sections/:section',        asyncWrap(updateSectionHandler)); // alias
router.put('/sections/:section/set',      asyncWrap(setBrainSectionHandler)); // full replace

// Memory
router.get('/memory',                     asyncWrap(getMemoryHandler));
router.post('/memory',                    asyncWrap(addMemoryHandler));
router.get('/memory/search',              asyncWrap(searchMemoryHandler));
router.delete('/memory/expire',           asyncWrap(expireMemoryHandler));

// Version history
router.get('/versions',                   asyncWrap(getBrainVersionsHandler));
router.post('/versions/:versionNum/restore', asyncWrap(restoreBrainVersionHandler));

// Locking
router.post('/lock',                      asyncWrap(lockBrainHandler));
router.post('/unlock',                    asyncWrap(unlockBrainHandler));

export default router;
