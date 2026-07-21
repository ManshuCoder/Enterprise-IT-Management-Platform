import { Router } from 'express';
import { getVpnSessions, disconnectVpnSession } from '../controllers/vpnController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getVpnSessions);
router.post('/disconnect/:id', requireRoles(['Admin', 'Network Engineer', 'Security Engineer']), disconnectVpnSession);

export default router;
