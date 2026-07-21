import { Router } from 'express';
import { getAdUsers, createAdUser, unlockUser, lockUser, resetUserPassword } from '../controllers/adController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/users', getAdUsers);

// Restricted actions
router.post('/users', requireRoles(['Admin', 'HR', 'System Support Engineer']), createAdUser);
router.post('/users/:id/unlock', requireRoles(['Admin', 'System Support Engineer']), unlockUser);
router.post('/users/:id/lock', requireRoles(['Admin', 'System Support Engineer']), lockUser);
router.post('/users/:id/reset-password', requireRoles(['Admin', 'System Support Engineer']), resetUserPassword);

export default router;
