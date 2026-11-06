import { Request, Response, NextFunction } from 'express';
import { extractToken } from './authenticate.js';
import { AuthService } from '../services/AuthService.js';

/**
 * Middleware: allows only authenticated users with role === 'EMPLOYEE'.
 */
export async function requireEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized', message: 'Employee session token required.' });
    return;
  }

  const session = await AuthService.getSession(token);
  if (!session || session.role !== 'EMPLOYEE') {
    res.status(401).json({ success: false, error: 'Unauthorized', message: 'Invalid or missing employee session.' });
    return;
  }

  req.user = { id: session.userId, email: session.email, name: session.name, role: session.role };
  req.sessionToken = token;
  next();
}
