import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import SecurityAlert from '../models/SecurityAlert';
import AuditLog from '../models/AuditLog';

export const getSecurityAlerts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await SecurityAlert.find().sort({ timestamp: -1 });
    return res.json(alerts);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
};

export const mitigateAlert = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const alert = await SecurityAlert.findById(id);

    if (!alert) return res.status(404).json({ error: 'Security alert not found' });

    alert.status = 'Mitigated';
    alert.threatScore = 0; // Threat neutralized
    await alert.save();

    await AuditLog.create({
      action: 'Security Incident Mitigated',
      actor: req.user?.username || 'unknown',
      category: 'Auth',
      details: `Mitigated security threat alert: "${alert.title}" on host ${alert.destDevice || 'N/A'}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json({ message: 'Incident successfully marked as mitigated.', alert });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mitigate security incident' });
  }
};

export const getSecuritySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await SecurityAlert.find();
    
    const totalAlerts = alerts.length;
    const activeAlerts = alerts.filter(a => a.status === 'Active').length;
    const investigatingAlerts = alerts.filter(a => a.status === 'Investigating').length;
    const mitigatedAlerts = alerts.filter(a => a.status === 'Mitigated').length;

    // Highest threat score among active alerts, or 0 if none
    const activeAlertScores = alerts
      .filter(a => a.status !== 'Mitigated')
      .map(a => a.threatScore);
    const overallThreatScore = activeAlertScores.length > 0 ? Math.max(...activeAlertScores) : 10; // baseline 10/100

    const countsByType = {
      'Brute Force': alerts.filter(a => a.type === 'Brute Force').length,
      'Malware Alert': alerts.filter(a => a.type === 'Malware Alert').length,
      'Intrusion Detection': alerts.filter(a => a.type === 'Intrusion Detection').length,
      'CVE Alert': alerts.filter(a => a.type === 'CVE Alert').length,
      'Failed Logins': alerts.filter(a => a.type === 'Failed Logins').length,
      'Unauthorized Scan': alerts.filter(a => a.type === 'Unauthorized Scan').length,
    };

    return res.json({
      summary: {
        totalAlerts,
        activeAlerts,
        investigatingAlerts,
        mitigatedAlerts,
        overallThreatScore
      },
      countsByType
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch security analytics summary' });
  }
};
