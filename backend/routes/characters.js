import { Router } from 'express';
import { asyncWrap } from '../middleware/errorHandler.js';
import {
  listCharacters, getCharacter, createCharacter, updateCharacter,
  evolveCharacterHandler, suggestRelationshipsHandler, deleteCharacter
} from '../controllers/charactersController.js';

const router = Router({ mergeParams: true }); // inherits :projectId

router.get('/',                         asyncWrap(listCharacters));
router.get('/relationships/suggest',    asyncWrap(suggestRelationshipsHandler));
router.get('/:id',                      asyncWrap(getCharacter));
router.post('/',                        asyncWrap(createCharacter));
router.patch('/:id',                    asyncWrap(updateCharacter));
router.post('/:id/evolve',             asyncWrap(evolveCharacterHandler));
router.delete('/:id',                  asyncWrap(deleteCharacter));

export default router;
