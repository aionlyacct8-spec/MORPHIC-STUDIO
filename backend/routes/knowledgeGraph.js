import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import * as ctrl from '../controllers/knowledgeGraphController.js';

const router = Router({ mergeParams: true });

// Full graph (nodes + edges)
router.get('/',                         asyncWrap(ctrl.getFullGraph));

// Nodes
router.get('/nodes',                    asyncWrap(ctrl.listNodes));
router.post('/nodes',                   asyncWrap(ctrl.upsertNode));
router.delete('/nodes',                 asyncWrap(ctrl.deleteNode));

// Edges
router.get('/edges',                    asyncWrap(ctrl.listEdges));
router.post('/edges',                   asyncWrap(ctrl.upsertEdge));

// Neighbors (1-hop)
router.get('/neighbors/:entityId',      asyncWrap(ctrl.getNeighbors));

export default router;
