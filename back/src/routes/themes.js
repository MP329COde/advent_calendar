import { Router } from 'express';
import {
  listThemes,
  getActiveTheme,
  getTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  activateTheme,
} from '../controllers/themeController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', listThemes);
router.get('/active', getActiveTheme);
router.get('/:id', getTheme);
router.post('/', requireAdmin, createTheme);
router.put('/:id', requireAdmin, updateTheme);
router.delete('/:id', requireAdmin, deleteTheme);
router.post('/:id/activate', requireAdmin, activateTheme);

export default router;
