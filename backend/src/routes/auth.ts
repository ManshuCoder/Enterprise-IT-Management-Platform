import { Router, Response } from 'express';
import { login, refreshToken } from '../controllers/authController';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import User from '../models/User';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);

// Get current user information
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch historical active logins for audit logs
router.get('/login-history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const user = await User.findById(req.user.userId).select('loginHistory');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user.loginHistory);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
