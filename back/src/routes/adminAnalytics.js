import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/adminAnalyticsController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/', getAnalyticsSummary);

export default router;
