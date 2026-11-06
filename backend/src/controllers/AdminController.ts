import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService.js';
import { AuthService } from '../services/AuthService.js';
import { getParam } from '../utils/params.js';

export class AdminController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await AdminService.getDashboardData();
      res.json({
        success: true,
        ...dashboard,
      });
    } catch (err) {
      next(err);
    }
  }

  public static getActivityLogs(req: Request, res: Response, next: NextFunction): void {
    try {
      const activities = AdminService.getActivityLogs();
      res.json({
        success: true,
        activities,
      });
    } catch (err) {
      next(err);
    }
  }

  public static getPermissionStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const status = AuthService.getAdminPermissionStatus();
      res.json({
        success: true,
        ...status,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async togglePermissionLock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { locked, adminPermissionKey } = req.body || {};
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const result = await AuthService.toggleAdminPasswordPermissionLock(Boolean(locked), adminPermissionKey, actor);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword, confirmPassword, adminPermissionKey, adminPermissionConfirmed } = req.body || {};
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const result = await AuthService.changeAdminPassword(
        oldPassword,
        newPassword,
        confirmPassword,
        actor,
        adminPermissionKey,
        adminPermissionConfirmed
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const user = await AdminService.createUser(req.body || {}, actor);
      res.status(201).json({
        success: true,
        message: `Account created successfully for ${user.name} (${user.email}).`,
        user,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const existing = await AdminService.deleteUser(id, actor);
      res.json({
        success: true,
        message: `User account for ${existing.name || existing.email} has been removed.`,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const { role } = req.body || {};
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const updated = await AdminService.updateUserRole(id, role, actor);
      res.json({
        success: true,
        message: `User access updated to ${role}.`,
        user: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static getPublicSettings(req: Request, res: Response, next: NextFunction): void {
    try {
      const settings = AdminService.getSiteSettings();
      res.json({
        success: true,
        settings,
      });
    } catch (err) {
      next(err);
    }
  }

  public static getSettings(req: Request, res: Response, next: NextFunction): void {
    try {
      const settings = AdminService.getSiteSettings();
      res.json({
        success: true,
        settings,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const settings = await AdminService.updateSiteSettings(req.body || {}, actor);
      res.json({
        success: true,
        message: 'Website settings updated successfully.',
        settings,
      });
    } catch (err) {
      next(err);
    }
  }
}
