import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import {
  listWorlds, getWorld, createWorld, updateWorld, deleteWorld,
  listLocations, createLocation, updateLocation,
} from '../controllers/worldsController.js';

const router = Router({ mergeParams: true }); // inherits :projectId

// Worlds
router.get('/',                         asyncWrap(listWorlds));
router.get('/:id',                      asyncWrap(getWorld));
router.post('/',                        asyncWrap(createWorld));
router.patch('/:id',                    asyncWrap(updateWorld));
router.delete('/:id',                   asyncWrap(deleteWorld));

// Locations
router.get('/locations/all',            asyncWrap(listLocations));
router.post('/:worldId/locations',      asyncWrap(createLocation));
router.patch('/locations/:id',          asyncWrap(updateLocation));

export default router;
