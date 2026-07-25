import { Router } from 'express';
import { getFeatures, getFeature, createFeature, updateFeature, deleteFeature } from '../controllers/featureController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware as any);
router.get('/', getFeatures as any);
router.get('/:id', getFeature as any);
router.post('/', createFeature as any);
router.put('/:id', updateFeature as any);
router.delete('/:id', deleteFeature as any);

export default router;
