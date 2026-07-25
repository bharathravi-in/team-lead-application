import { Router } from 'express';
import { parseStandupWithAI } from '../controllers/aiController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.post('/parse-standup', parseStandupWithAI);

export default router;
