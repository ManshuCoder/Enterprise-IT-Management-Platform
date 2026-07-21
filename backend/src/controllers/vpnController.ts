import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import VpnSession from '../models/VpnSession';
import AuditLog from '../models/AuditLog';

export const getVpnSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await VpnSession.find().sort({ connectedAt: -1 });
    return res.json(sessions);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch VPN sessions' });
  }
};

export const disconnectVpnSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await VpnSession.findById(id);

    if (!session) return res.status(404).json({ error: 'VPN session not found' });

    session.status = 'Disconnected';
    session.disconnectedAt = new Date();
    await session.save();

    // Log the termination of session
    await AuditLog.create({
      action: 'Terminate VPN Connection',
      actor: req.user?.username || 'unknown',
      category: 'VPN',
      details: `Admin forced disconnection of VPN session for user ${session.username} (IP: ${session.ip})`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json({ message: `Session for ${session.username} successfully disconnected.`, session });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to disconnect VPN session' });
  }
};
