import { Router } from 'express';
import { 
  getGlobalPeople, 
  createGlobalPerson, 
  updateGlobalPerson, 
  deleteGlobalPerson 
} from '../controllers/peopleController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware as any);

router.get('/', getGlobalPeople as any);
router.post('/', createGlobalPerson as any);
router.put('/:personId', updateGlobalPerson as any);
router.delete('/:personId', deleteGlobalPerson as any);

export default router;
