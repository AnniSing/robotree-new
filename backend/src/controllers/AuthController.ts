import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { buildCookie } from '../middleware/csrf.js';
import { repositories } from '../repositories/index.js';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      const { user, session } = await AuthService.register(name, email, password, role);

      res.setHeader('Set-Cookie', buildCookie('robotree_session', session.id, 7 * 24 * 60 * 60));
      res.status(200).json({
        success: true,
        token: session.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, role } = req.body;
      const { user, session } = await AuthService.login(email, password, role);

      res.setHeader('Set-Cookie', buildCookie('robotree_session', session.id, 7 * 24 * 60 * 60));
      res.status(200).json({
        success: true,
        token: session.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      user: req.user,
    });
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.sessionToken) {
        await AuthService.logout(req.sessionToken);
      }
      res.setHeader('Set-Cookie', buildCookie('robotree_session', '', 0));
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, newPassword } = req.body;
      const user = await AuthService.resetPassword(email, newPassword);
      res.json({
        success: true,
        message: 'Password has been securely reset.',
        email: user.email,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await repositories.users.findById(req.user!.id);
      const profile = {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        createdAt: user?.createdAt,
      };

      res.json({
        success: true,
        profile,
        user: profile,
        data: {
          profile,
          user: profile,
          gdprComplianceNotice: 'Exported under GDPR Article 20 (Right to data portability).',
          exportedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;
      await AuthService.deleteAccount(req.user!.id, password);
      res.setHeader('Set-Cookie', buildCookie('robotree_session', '', 0));
      res.json({
        success: true,
        message: 'Your account and personal data have been completely erased under GDPR Right to Erasure.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { passcode } = req.body;
      const { token, role } = await AuthService.adminLogin(passcode);

      res.setHeader('Set-Cookie', buildCookie('robotree_admin_token', token, 8 * 60 * 60));
      res.json({
        success: true,
        token,
        role,
        message: 'Admin access granted.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async adminLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.sessionToken) {
        await AuthService.logout(req.sessionToken);
      }
      res.setHeader('Set-Cookie', buildCookie('robotree_admin_token', '', 0));
      res.json({ success: true, message: 'Admin logged out.' });
    } catch (err) {
      next(err);
    }
  }
}
