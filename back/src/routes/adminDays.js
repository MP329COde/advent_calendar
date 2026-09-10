import { Router } from 'express';
import { listAdminDays, updateAdminDay } from '../controllers/adminDaysController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/', listAdminDays);
router.patch('/:id', updateAdminDay);

export default router;
