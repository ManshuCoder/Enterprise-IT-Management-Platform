import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const adUserCreateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'Firewall Engineer', 'System Support Engineer', 'Network Engineer', 'Security Engineer', 'Employee', 'HR', 'Manager']),
  department: z.string().min(1, 'Department is required')
});

export const getAdUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch Active Directory users' });
  }
};

export const createAdUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = adUserCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { username, email, password, role, department } = parseResult.data;

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ error: 'Active Directory user already exists with this username or email.' });
    }

    const newUser = new User({
      username,
      email,
      password, // Password will be hashed in the pre-save hook
      role,
      department,
      status: 'Active'
    });

    await newUser.save();

    await AuditLog.create({
      action: 'Active Directory User Created',
      actor: req.user?.username || 'unknown',
      category: 'Active Directory',
      details: `Created user account: "${username}" inside OU: "${department}" with role: "${role}"`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.status(201).json({
      message: 'Active Directory account provisioned successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        status: newUser.status
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Provisioning Active Directory account failed' });
  }
};

export const unlockUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ error: 'AD User not found' });

    user.status = 'Active';
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await AuditLog.create({
      action: 'Active Directory User Unlocked',
      actor: req.user?.username || 'unknown',
      category: 'Active Directory',
      details: `Unlocked account for user "${user.username}"`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json({ message: `Account "${user.username}" unlocked successfully.`, user });
  } catch (error) {
    return res.status(500).json({ error: 'Unlocking AD account failed' });
  }
};

export const lockUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ error: 'AD User not found' });

    user.status = 'Locked';
    user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // Lock manually for 24h
    await user.save();

    await AuditLog.create({
      action: 'Active Directory User Locked',
      actor: req.user?.username || 'unknown',
      category: 'Active Directory',
      details: `Administrative lock applied to user "${user.username}"`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json({ message: `Account "${user.username}" administratively locked.`, user });
  } catch (error) {
    return res.status(500).json({ error: 'Locking AD account failed' });
  }
};

export const resetUserPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'A password of at least 6 characters is required.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'AD User not found' });

    // Set new password (pre-save hook hashes it)
    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await AuditLog.create({
      action: 'Active Directory Password Reset',
      actor: req.user?.username || 'unknown',
      category: 'Active Directory',
      details: `Reset password for user "${user.username}"`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json({ message: `Password for "${user.username}" has been reset.` });
  } catch (error) {
    return res.status(500).json({ error: 'Resetting AD user password failed' });
  }
};
