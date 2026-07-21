import { Router } from 'express';
import { getAuditLogs, getAuditAnalytics } from '../controllers/auditController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/logs', getAuditLogs);
router.get('/analytics', getAuditAnalytics);

export default router;
