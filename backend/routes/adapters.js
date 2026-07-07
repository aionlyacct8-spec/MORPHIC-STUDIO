import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import { planComfyUiPanel } from '../controllers/adaptersController.js';

const router = Router({ mergeParams: true });

router.post('/comfyui/plan', asyncWrap(planComfyUiPanel));

export default router;
