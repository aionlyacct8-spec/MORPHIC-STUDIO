import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import {
  listProjects, getProject, createProject, updateProject, deleteProject
} from '../controllers/projectsController.js';

const router = Router();

router.get('/',           asyncWrap(listProjects));
router.get('/:id',        asyncWrap(getProject));
router.post('/',          asyncWrap(createProject));
router.patch('/:id',      asyncWrap(updateProject));
router.delete('/:id',     asyncWrap(deleteProject));

export default router;
