import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService.js';
import { AuthService } from '../services/AuthService.js';
import { getParam } from '../utils/params.js';
import { ValidationError } from '../errors/AppError.js';
import { extractClientIp } from '../utils/ip.js';

export class AdminController {
  public static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = extractClientIp(req);
      const dashboard = await AdminService.getDashboardData();
      res.json({
        success: true,
        clientIp,
        ...dashboard,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getActivityLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activities = await AdminService.getActivityLogs();
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
      const clientIp = extractClientIp(req);
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
      const clientIp = extractClientIp(req);
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
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const user = await AdminService.createUser(req.body || {}, actor, clientIp);
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
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const existing = await AdminService.deleteUser(id, actor, clientIp);
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
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const updated = await AdminService.updateUserRole(id, role, actor, clientIp);
      res.json({
        success: true,
        message: `User access updated to ${role}.`,
        user: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPublicSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AdminService.getSiteSettings();
      res.json({
        success: true,
        settings,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AdminService.getSiteSettings();
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
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const settings = await AdminService.updateSiteSettings(req.body || {}, actor, clientIp);
      res.json({
        success: true,
        message: 'Website settings updated successfully.',
        settings,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listInstitutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const institutes = await AdminService.listInstitutes();
      res.json({
        success: true,
        institutes,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createInstitute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const institute = await AdminService.createInstitute(req.body || {}, actor, clientIp);
      res.status(201).json({
        success: true,
        message: 'Partner institution added successfully.',
        institute,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateInstitute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const institute = await AdminService.updateInstitute(String(req.params.id), req.body || {}, actor, clientIp);
      res.json({
        success: true,
        message: 'Partner institution updated successfully.',
        institute,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteInstitute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const institute = await AdminService.deleteInstitute(String(req.params.id), actor, clientIp);
      res.json({
        success: true,
        message: 'Partner institution removed successfully.',
        institute,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 50;
      const entity = req.query.entity ? String(req.query.entity) : undefined;
      const history = await AdminService.getHistory(limit, entity);
      res.json({
        success: true,
        count: history.length,
        history,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async restoreHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { historyId } = req.body || {};
      if (!historyId) {
        throw new ValidationError('historyId is required for restore.');
      }
      const clientIp = extractClientIp(req);
      const actor = (req as any).user?.email || 'admin@robotree.org';
      const result = await AdminService.restoreHistory(String(historyId), actor, clientIp);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}
