import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search, status } = req.query;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { actor: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve system audit logs' });
  }
};

export const getAuditAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalCount = await AuditLog.countDocuments();
    const successCount = await AuditLog.countDocuments({ status: 'Success' });
    const failureCount = await AuditLog.countDocuments({ status: 'Failed' });

    const categories = ['Auth', 'Firewall', 'Network', 'Active Directory', 'Server Management', 'Helpdesk', 'VPN', 'System'];
    const distribution: Record<string, number> = {};

    for (const cat of categories) {
      distribution[cat] = await AuditLog.countDocuments({ category: cat });
    }

    return res.json({
      totalCount,
      successCount,
      failureCount,
      distribution
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to aggregate audit analytics' });
  }
};
