import express from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import { getConfig, getQueueStatus, getStorageStatus, uploadProjectObject } from '../controllers/systemController.js';

const router = express.Router({ mergeParams: true });

router.get('/config', getConfig);
router.get('/queues', getQueueStatus);
router.get('/storage', asyncWrap(getStorageStatus));
router.post('/projects/:projectId/storage/objects', asyncWrap(uploadProjectObject));

export default router;
