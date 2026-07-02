import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import * as ctrl from '../controllers/generationJobsController.js';

const router = Router({ mergeParams: true });

router.get('/',                  asyncWrap(ctrl.listJobs));
router.get('/stats',             asyncWrap(ctrl.getJobStats));
router.post('/dispatch', aiLimiter, asyncWrap(ctrl.dispatchJob));
router.get('/:jobId',            asyncWrap(ctrl.getJob));
router.delete('/:jobId',         asyncWrap(ctrl.cancelJob));

export default router;
