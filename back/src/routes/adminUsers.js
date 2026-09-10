import { Router } from 'express';
import { listUsers, updateUser, deleteUser } from '../controllers/adminUsersController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/', listUsers);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
