import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Invalidate all existing tokens on each server boot.
const BOOT_TIME = Math.floor(Date.now() / 1000);

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export interface BarAuthRequest extends Request {
  barUserId?: string;
  barId?: string;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; email: string; iat?: number };
    if (decoded.iat && decoded.iat < BOOT_TIME) {
      return res.status(403).json({ error: 'Token invalidated after server restart' });
    }
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { isAdmin: boolean; iat?: number };
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    if (decoded.iat && decoded.iat < BOOT_TIME) {
      return res.status(403).json({ error: 'Token invalidated after server restart' });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired admin token' });
  }
}

export function authenticateBarUser(req: BarAuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Bar token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.BAR_JWT_SECRET!) as { barUserId: string; barId: string; iat?: number };
    if (decoded.iat && decoded.iat < BOOT_TIME) {
      return res.status(403).json({ error: 'Token invalidated after server restart' });
    }
    req.barUserId = decoded.barUserId;
    req.barId = decoded.barId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired bar token' });
  }
}
