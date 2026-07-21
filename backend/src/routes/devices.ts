import { Router } from 'express';
import { getDevices, getDeviceById, createDevice, updateDevice, toggleDevicePower, executeCommand } from '../controllers/deviceController';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getDevices);
router.get('/:id', getDeviceById);
router.post('/:id/command', executeCommand);

// Asset registration, updating, and power toggles require Admin, Network Engineer or System Support Engineer roles
router.post('/', requireRoles(['Admin', 'Network Engineer', 'System Support Engineer']), createDevice);
router.put('/:id', requireRoles(['Admin', 'Network Engineer', 'System Support Engineer']), updateDevice);
router.post('/:id/toggle', requireRoles(['Admin', 'Network Engineer', 'System Support Engineer']), toggleDevicePower);

export default router;
