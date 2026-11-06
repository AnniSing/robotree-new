import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { Role } from '../types/index.js';
import { parseCookies } from './csrf.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
      sessionToken?: string;
      requestId?: string;
    }
  }
}

export function extractToken(req: Request): string {
  const authHeader = req.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.get('cookie'));
  return cookies.robotree_session || cookies.robotree_admin_token || '';
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication token is required.',
    });
    return;
  }

  const session = await AuthService.getSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Session is invalid or expired. Please sign in again.',
    });
    return;
  }

  req.user = {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  };
  req.sessionToken = token;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Admin authorization token required.',
    });
    return;
  }

  const session = await AuthService.getSession(token);
  if (!session) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired admin session token.',
    });
    return;
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Access denied: Only system administrators are authorized to perform this action.',
    });
    return;
  }

  req.user = {
    id: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
  };
  req.sessionToken = token;
  next();
}
