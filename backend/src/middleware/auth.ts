import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, ITokenPayload } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: ITokenPayload;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please authenticate.' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired access token.' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User is not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Requires one of these roles: [${allowedRoles.join(', ')}]. Current role: [${req.user.role}].`
      });
    }

    next();
  };
};
