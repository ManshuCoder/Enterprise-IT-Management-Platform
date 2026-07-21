import { Router } from 'express';
import { getRules, createRule, updateRule, deleteRule, reorderRules, simulatePacket } from '../controllers/firewallController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Apply auth token to all firewall actions
router.use(authenticateToken);

router.get('/', getRules);
router.post('/simulate', simulatePacket);

// Admin and Firewall Engineers only for rules modification
router.post('/', requireRoles(['Admin', 'Firewall Engineer']), createRule);
router.put('/:id', requireRoles(['Admin', 'Firewall Engineer']), updateRule);
router.delete('/:id', requireRoles(['Admin', 'Firewall Engineer']), deleteRule);
router.post('/reorder', requireRoles(['Admin', 'Firewall Engineer']), reorderRules);

export default router;
