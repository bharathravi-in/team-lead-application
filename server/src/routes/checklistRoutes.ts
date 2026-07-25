import { Router } from 'express';
import { getChecklists, addChecklistItem, toggleChecklistItem, updateChecklistItem, deleteChecklistItem } from '../controllers/checklistController';
import { authMiddleware } from '../middleware/auth';

const router = Router({ mergeParams: true });
router.use(authMiddleware as any);
router.get('/', getChecklists as any);
router.post('/', addChecklistItem as any);
router.patch('/:checklistId/toggle', toggleChecklistItem as any);
router.put('/:checklistId', updateChecklistItem as any);
router.delete('/:checklistId', deleteChecklistItem as any);

export default router;
