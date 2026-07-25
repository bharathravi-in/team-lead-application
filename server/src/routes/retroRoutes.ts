import { Router } from 'express';
import { getRetrospectives, createRetrospective, updateRetrospective, deleteRetrospective } from '../controllers/retroController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware as any);
router.get('/', getRetrospectives as any);
router.post('/', createRetrospective as any);
router.put('/:retroId', updateRetrospective as any);
router.delete('/:retroId', deleteRetrospective as any);

export default router;
