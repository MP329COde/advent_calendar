import { Router } from 'express';
import { getSetupStatus, getSetupMeta, completeSetup } from '../controllers/setupController.js';

const router = Router();

router.get('/meta', getSetupMeta);
router.get('/', getSetupStatus);
router.post('/', completeSetup);

export default router;
