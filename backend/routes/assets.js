import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import {
  listAssets, getAsset, createAsset, updateAsset,
  incrementUsage, deleteAsset, getAssetStats,
  listVersions, createVersion,
  listStorageObjects, listRelationships, createRelationship,
} from '../controllers/assetsController.js';

const router = Router({ mergeParams: true }); // inherits :projectId

router.get('/',              asyncWrap(listAssets));
router.get('/stats',         asyncWrap(getAssetStats));
router.get('/:id',           asyncWrap(getAsset));
router.post('/',             asyncWrap(createAsset));
router.patch('/:id',         asyncWrap(updateAsset));
router.post('/:id/use',      asyncWrap(incrementUsage));
router.delete('/:id',        asyncWrap(deleteAsset));

// Asset versioning
router.get('/:id/versions',      asyncWrap(listVersions));
router.post('/:id/versions',     asyncWrap(createVersion));
router.get('/:id/storage',       asyncWrap(listStorageObjects));
router.get('/:id/relationships', asyncWrap(listRelationships));
router.post('/:id/relationships', asyncWrap(createRelationship));

export default router;
