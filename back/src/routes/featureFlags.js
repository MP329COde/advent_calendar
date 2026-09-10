import { Router } from 'express';
import { listFeatureFlags, updateFeatureFlag } from '../controllers/featureFlagsController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/', listFeatureFlags);
router.patch('/:key', updateFeatureFlag);

export default router;
