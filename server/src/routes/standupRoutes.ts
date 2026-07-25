import { Router } from 'express';
import { getStandups, getStandupDates, upsertStandup, deleteStandup } from '../controllers/standupController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware as any);
router.get('/', getStandups as any);
router.get('/dates', getStandupDates as any);
router.post('/', upsertStandup as any);
router.delete('/:standupId', deleteStandup as any);

export default router;
