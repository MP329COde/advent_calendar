import { Router } from 'express';
import { getBrandingHandler, updateBranding } from '../controllers/brandingController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getBrandingHandler);
router.put('/', requireAdmin, updateBranding);

export default router;
