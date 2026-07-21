import { Router } from 'express';
import { getSecurityAlerts, mitigateAlert, getSecuritySummary } from '../controllers/securityController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/alerts', getSecurityAlerts);
router.get('/summary', getSecuritySummary);
router.post('/mitigate/:id', requireRoles(['Admin', 'Security Engineer']), mitigateAlert);

export default router;
