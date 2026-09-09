import { Router } from 'express';
import { getDays, getDay } from '../controllers/daysController.js';

const router = Router();

router.get('/', getDays);
router.get('/:day', getDay);

export default router;
