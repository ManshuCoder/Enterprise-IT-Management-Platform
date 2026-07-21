import { Request, Response } from 'express';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const login = async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { username, password } = parseResult.data;
    const user = await User.findOne({ username });

    if (!user) {
      // Create failure audit log
      await AuditLog.create({
        action: 'User Login Failed',
        actor: username,
        category: 'Auth',
        details: `Failed authentication attempt: Username does not exist.`,
        ipAddress: ip,
        status: 'Failed'
      });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if account is locked
    if (user.status === 'Locked') {
      if (user.lockUntil && user.lockUntil > new Date()) {
        const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
        return res.status(403).json({
          error: `This Active Directory account is locked due to security policy. Try again in ${minutesLeft} minutes.`
        });
      } else {
        // Unlock expired lock
        user.status = 'Active';
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;
      let isLocking = false;

      if (user.loginAttempts >= 5) {
        user.status = 'Locked';
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        isLocking = true;
      }

      user.loginHistory = user.loginHistory || [];
      user.loginHistory.push({
        timestamp: new Date(),
        ip,
        userAgent,
        success: false
      });

      await user.save();

      // Log failure in global audit
      await AuditLog.create({
        action: isLocking ? 'User AD Account Locked' : 'User Login Failed',
        actor: username,
        category: 'Active Directory',
        details: isLocking
          ? `Account locked due to 5 consecutive authentication failures.`
          : `Failed password entry. Attempts remaining before lockout: ${5 - user.loginAttempts}`,
        ipAddress: ip,
        status: 'Failed'
      });

      return res.status(401).json({
        error: isLocking
          ? 'Active Directory account has been locked. Please contact your IT Administrator.'
          : `Invalid username or password. ${5 - user.loginAttempts} attempts remaining.`
      });
    }

    // Login successful
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    user.loginHistory = user.loginHistory || [];
    user.loginHistory.push({
      timestamp: new Date(),
      ip,
      userAgent,
      success: true
    });

    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create success audit log
    await AuditLog.create({
      action: 'User Login Succeeded',
      actor: username,
      category: 'Auth',
      details: `Successful login session initialized. Role: ${user.role}`,
      ipAddress: ip,
      status: 'Success'
    });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status
      }
    });

  } catch (err: any) {
    console.error('[Login Controller Error]:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || user.status === 'Locked') {
      return res.status(403).json({ error: 'User account is locked or disabled.' });
    }

    const accessToken = generateAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
};
