import { Router } from 'express';
import { getDays, getDay, checkQuizAnswer } from '../controllers/daysController.js';

const router = Router();

router.get('/', getDays);
router.get('/:day', getDay);
router.post('/:day/quiz', checkQuizAnswer);

export default router;
