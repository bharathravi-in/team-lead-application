import { Router } from 'express';
import { 
  getFeaturePeople, 
  assignPeopleToFeature, 
  unassignPersonFromFeature 
} from '../controllers/peopleController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware as any);

router.get('/', getFeaturePeople as any);
router.post('/', assignPeopleToFeature as any);
router.delete('/:personId', unassignPersonFromFeature as any);

export default router;
