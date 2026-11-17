import crypto from 'node:crypto';
import { db } from '../persistence/json-database.js';
import { repositories } from '../repositories/index.js';
import { AuditService } from './AuditService.js';
import { SyncService } from './SyncService.js';
import { NotFoundError, ValidationError, ConflictError } from '../errors/AppError.js';
import { hashPassword } from '../security/hasher.js';
import { Role, User, SiteSettings, AuditLog } from '../models/index.js';

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  role?: string;
}

export interface UpdateSettingsDto {
  heroStatNumber?: string;
  heroStatLabel?: string;
  governmentProtocol?: string;
}

export class AdminService {
  public static async getDashboardData(): Promise<any> {
    const users = await repositories.users.list().catch(() => db.getUsers());
    const inquiries = await repositories.inquiries.list().catch(() => db.getInquiries());
    const applications = db.getApplications();
    const certificates = await repositories.certificates.list().catch(() => db.getCertificates());
    const activities = await repositories.audit.list(200).catch(() => db.getActivities());
    const newsletters = db.getNewsletters();
    const programInterests = db.getProgramInterests();
    const feedback = db.getFeedback();
    const analytics = db.getAnalytics();
    const eventsGallery = await repositories.events.list().catch(() => db.getEvents());
    const team = await repositories.team.list().catch(() => db.getTeam());
    const courses = await repositories.courses.list().catch(() => db.getCourses());
    const institutes = await repositories.institutes.list().catch(() => (db.getInstitutes ? db.getInstitutes() : []));
    const showcaseGallery = await repositories.showcase.list().catch(() => (db.getShowcase ? db.getShowcase() : []));
    const products = await repositories.products.list().catch(() => (db.getProducts ? db.getProducts() : []));
    const orders = db.getOrders ? db.getOrders() : [];

    const studentAccounts = users.filter((u: any) => (u.role || '').toLowerCase() === 'student').length;
    const employeeAccounts = users.filter((u: any) =>
      ['employee', 'staff', 'admin', 'super_admin'].includes((u.role || '').toLowerCase())
    ).length;

    const normalizeActivity = (item: any) => ({
      id: item.id || `act_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: item.timestamp || new Date().toISOString(),
      user: item.user || item.actor || 'admin@robotree.org',
      type: item.type || item.action || 'ACTIVITY',
      details: item.details || '',
      ip: item.ip || '127.0.0.1',
      status: item.status || (item.result === 'FAILURE' ? 'FAILED' : 'SUCCESS'),
    });

    const normalizedActivities = activities.map(normalizeActivity);
    const failedLogins = normalizedActivities.filter(
      (item: any) => String(item.type).includes('LOGIN_FAILED') || item.status === 'FAILED'
    );
    const accountActivity = normalizedActivities.filter((item: any) =>
      ['ACCOUNT_CREATED', 'USER_LOGIN', 'USER_LOGIN_FAILED', 'ADMIN_LOGIN_SUCCESS', 'ADMIN_LOGIN_FAILED'].includes(String(item.type))
    );

    const history = await repositories.history.list(50).catch(() => []);

    const sanitizedUsers = users.map((u: any) => {
      const copy = { ...u };
      delete copy.passwordHash;
      return copy;
    });

    const settings = await AdminService.getSiteSettings();

    return {
      stats: {
        totalUsers: users.length,
        studentAccounts,
        employeeAccounts,
        totalInquiries: inquiries.length,
        totalApplications: applications.length,
        totalCertificates: certificates.length,
        totalNewsletters: newsletters.length,
        totalProgramInterests: programInterests.length,
        totalFeedback: feedback.length,
        totalAnalyticsEvents: analytics.length,
        totalGalleryItems: eventsGallery.length,
        totalTeamMembers: team.length,
        totalCourses: courses.length,
        totalInstitutes: institutes.length,
        failedLogins: failedLogins.length,
        failedLoginCount: failedLogins.length,
      },
      users: sanitizedUsers,
      failedLogins,
      accountActivity,
      inquiries,
      applications,
      certificates,
      certs: certificates,
      activities: normalizedActivities,
      history,
      newsletters,
      programInterests,
      feedback,
      eventsGallery,
      showcaseGallery,
      team,
      courses,
      institutes,
      settings,
      products,
      orders,
      data: {
        users: sanitizedUsers,
        inquiries,
        applications,
        certificates,
        certs: certificates,
        activities: normalizedActivities,
        history,
        newsletters,
        programInterests,
        feedback,
        eventsGallery,
        team,
        courses,
        institutes,
        settings,
        products,
        orders,
      },
    };
  }

  public static async getActivityLogs(): Promise<AuditLog[]> {
    try {
      const logs = await repositories.audit.list(200);
      if (logs && logs.length > 0) return logs;
    } catch (_) {}
    return db.getActivities() || [];
  }

  public static async getSiteSettings(): Promise<SiteSettings> {
    try {
      const settings = await repositories.settings.get();
      if (settings) return settings;
    } catch (_) {}
    const rawSettings = db.getSettings() || {};
    return {
      heroStatNumber: rawSettings.heroStatNumber || '20,000+',
      heroStatLabel: rawSettings.heroStatLabel || 'Students Trained',
      governmentProtocol: rawSettings.governmentProtocol || 'Robotree Robotics LLP • Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity)',
      adminPasswordPermissionLocked: Boolean(rawSettings.adminPasswordPermissionLocked),
    };
  }

  public static async updateSiteSettings(dto: UpdateSettingsDto, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<SiteSettings> {
    const updates: Partial<SiteSettings> = {};

    if (dto.heroStatNumber !== undefined) {
      updates.heroStatNumber = String(dto.heroStatNumber).trim().slice(0, 50);
    }
    if (dto.heroStatLabel !== undefined) {
      updates.heroStatLabel = String(dto.heroStatLabel).trim().slice(0, 100);
    }
    if (dto.governmentProtocol !== undefined) {
      updates.governmentProtocol = String(dto.governmentProtocol).trim().slice(0, 500);
    }

    const previous = await this.getSiteSettings();
    const updated = await repositories.settings.update(updates);

    // Broadcast real-time change to all connected clients & browsers
    SyncService.broadcast('settings', 'UPDATE', 'site_settings');

    await repositories.history.record('settings', 'site_settings', 'UPDATE', previous, updated, actor, ip);

    await AuditService.logAction(
      actor,
      'SETTINGS_UPDATED',
      'settings',
      `Admin updated website content: Hero Stat "${updated.heroStatNumber}" (${updated.heroStatLabel}) from IP ${ip}`,
      { resourceId: 'site-settings', result: 'SUCCESS', ip }
    );

    return updated;
  }

  public static async createUser(dto: CreateUserDto, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<Omit<User, 'passwordHash'>> {
    const { name, email, password, role } = dto;
    if (!name || !email) {
      throw new ValidationError('Name and email are required.');
    }

    const normalizedRole = ((role || 'student').toUpperCase()) as Role;
    const existing = await repositories.users.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email address already exists.');
    }

    const defaultPassword = password || 'Robotree@2026';
    const passwordHash = await hashPassword(defaultPassword);
    const userId = 'USR_' + crypto.randomBytes(6).toString('hex');

    const newUser = await repositories.users.create({
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: normalizedRole,
    });

    SyncService.broadcast('users', 'CREATE', userId);

    await repositories.history.record('users', userId, 'CREATE', null, newUser, actor, ip);

    await AuditService.logAction(
      actor,
      'USER_CREATED',
      'users',
      `Admin created user: ${newUser.email} (${newUser.role}) from IP ${ip}`,
      { resourceId: userId, ip }
    );

    const sanitized = { ...newUser };
    delete (sanitized as any).passwordHash;
    return sanitized;
  }

  public static async deleteUser(id: string, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<User> {
    const existing = await repositories.users.findById(id);
    if (!existing) {
      throw new NotFoundError('User account not found.');
    }
    await repositories.users.delete(id);
    SyncService.broadcast('users', 'DELETE', id);

    await repositories.history.record('users', id, 'DELETE', existing, null, actor, ip);

    await AuditService.logAction(
      actor,
      'USER_DELETED',
      'users',
      `Admin deleted user: ${existing.email} (${existing.role}) from IP ${ip}`,
      { resourceId: id, ip }
    );
    return existing;
  }

  public static async updateUserRole(id: string, role: string, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<User> {
    if (!id || !role) {
      throw new ValidationError('User ID and role are required.');
    }
    const existing = await repositories.users.findById(id);
    if (!existing) {
      throw new NotFoundError('User account not found.');
    }
    const updated = await repositories.users.update(id, { role: role.toUpperCase() as Role });
    if (!updated) {
      throw new NotFoundError('User account not found.');
    }
    SyncService.broadcast('users', 'UPDATE', id);

    await repositories.history.record('users', id, 'UPDATE', { role: existing.role }, { role: updated.role }, actor, ip);

    await AuditService.logAction(
      actor,
      'USER_ROLE_UPDATED',
      'users',
      `Admin changed role of ${existing.email} to ${role} from IP ${ip}`,
      { resourceId: id, ip }
    );
    return updated;
  }

  public static async listInstitutes(): Promise<any[]> {
    return repositories.institutes.list();
  }

  public static async createInstitute(payload: any, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<any> {
    if (!payload.name) {
      throw new ValidationError('Institute name is required.');
    }
    const id = payload.id || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `inst-${Date.now()}`;
    const tags = Array.isArray(payload.tags)
      ? payload.tags
      : (typeof payload.tags === 'string' ? payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);

    const newInst = {
      id,
      name: payload.name.trim(),
      tier: payload.tier ? payload.tier.trim() : 'Institute Partner',
      category: payload.category ? payload.category.trim() : 'engineering',
      location: payload.location ? payload.location.trim() : 'India',
      logo: payload.logo ? payload.logo.trim() : 'assets/colleges/logo_dit_dhanbad.png',
      description: payload.description ? payload.description.trim() : '',
      tags,
      status: payload.status ? payload.status.trim() : 'Verified Academic Partner',
      createdAt: new Date().toISOString()
    };

    const created = await repositories.institutes.create(newInst);
    SyncService.broadcast('institutes', 'CREATE', id);

    await repositories.history.record('institutes', id, 'CREATE', null, created, actor, ip);

    await AuditService.logAction(
      actor,
      'INSTITUTE_CREATED',
      'institutes',
      `Admin added partner institute: ${newInst.name} (${newInst.tier}) from IP ${ip}`,
      { resourceId: id, ip }
    );
    return created;
  }

  public static async updateInstitute(id: string, payload: any, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<any> {
    if (!id) {
      throw new ValidationError('Institute ID is required.');
    }
    const existing = await repositories.institutes.findById(id);
    if (!existing) {
      throw new NotFoundError('Partner institute not found.');
    }

    const tags = payload.tags !== undefined
      ? (Array.isArray(payload.tags) ? payload.tags : (typeof payload.tags === 'string' ? payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []))
      : existing.tags;

    const updates = {
      ...existing,
      name: payload.name !== undefined ? payload.name.trim() : existing.name,
      tier: payload.tier !== undefined ? payload.tier.trim() : existing.tier,
      category: payload.category !== undefined ? payload.category.trim() : existing.category,
      location: payload.location !== undefined ? payload.location.trim() : existing.location,
      logo: payload.logo !== undefined ? payload.logo.trim() : existing.logo,
      description: payload.description !== undefined ? payload.description.trim() : existing.description,
      tags,
      status: payload.status !== undefined ? payload.status.trim() : existing.status,
      updatedAt: new Date().toISOString()
    };

    const updated = await repositories.institutes.update(id, updates);
    SyncService.broadcast('institutes', 'UPDATE', id);

    await repositories.history.record('institutes', id, 'UPDATE', existing, updated, actor, ip);

    await AuditService.logAction(
      actor,
      'INSTITUTE_UPDATED',
      'institutes',
      `Admin updated partner institute: ${updated.name} from IP ${ip}`,
      { resourceId: id, ip }
    );
    return updated;
  }

  public static async deleteInstitute(id: string, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<any> {
    if (!id) {
      throw new ValidationError('Institute ID is required.');
    }
    const existing = await repositories.institutes.findById(id);
    if (!existing) {
      throw new NotFoundError('Partner institute not found.');
    }

    await repositories.institutes.delete(id);
    SyncService.broadcast('institutes', 'DELETE', id);

    await repositories.history.record('institutes', id, 'DELETE', existing, null, actor, ip);

    await AuditService.logAction(
      actor,
      'INSTITUTE_DELETED',
      'institutes',
      `Admin removed partner institute: ${existing.name} from IP ${ip}`,
      { resourceId: id, ip }
    );
    return existing;
  }

  public static async getHistory(limit = 50, entity?: string): Promise<any[]> {
    return repositories.history.list(limit, entity);
  }

  public static async restoreHistory(historyId: string, actor: string = 'admin@robotree.org', ip: string = '127.0.0.1'): Promise<any> {
    const item = await repositories.history.findById(historyId);
    if (!item) {
      throw new NotFoundError(`History revision record not found: ${historyId}`);
    }

    const { entity, entityId, previousData, action } = item;
    let restoredRecord: any = null;

    const targetState = previousData;
    if (!targetState && action !== 'DELETE') {
      throw new ValidationError(`No previous snapshot state available for restore.`);
    }

    switch (entity) {
      case 'courses':
        if (targetState) {
          const exists = await repositories.courses.findById(entityId);
          if (exists) {
            restoredRecord = await repositories.courses.update(entityId, targetState);
          } else {
            restoredRecord = await repositories.courses.create(targetState);
          }
        } else {
          await repositories.courses.delete(entityId);
        }
        SyncService.broadcast('courses', 'UPDATE', entityId);
        break;

      case 'team':
        if (targetState) {
          const exists = await repositories.team.findById(entityId);
          if (exists) {
            restoredRecord = await repositories.team.update(entityId, targetState);
          } else {
            restoredRecord = await repositories.team.create(targetState);
          }
        } else {
          await repositories.team.delete(entityId);
        }
        SyncService.broadcast('team', 'UPDATE', entityId);
        break;

      case 'events':
      case 'events_gallery':
        if (targetState) {
          const exists = await repositories.events.findById(entityId);
          if (exists) {
            restoredRecord = await repositories.events.update(entityId, targetState);
          } else {
            restoredRecord = await repositories.events.create(targetState);
          }
        } else {
          await repositories.events.delete(entityId);
        }
        SyncService.broadcast('events', 'UPDATE', entityId);
        break;

      case 'products':
        if (targetState) {
          const exists = await repositories.products.findById(entityId);
          if (exists) {
            restoredRecord = await repositories.products.update(entityId, targetState);
          } else {
            restoredRecord = await repositories.products.create(targetState);
          }
        } else {
          await repositories.products.delete(entityId);
        }
        SyncService.broadcast('products', 'UPDATE', entityId);
        break;

      case 'institutes':
        if (targetState) {
          const exists = await repositories.institutes.findById(entityId);
          if (exists) {
            restoredRecord = await repositories.institutes.update(entityId, targetState);
          } else {
            restoredRecord = await repositories.institutes.create(targetState);
          }
        } else {
          await repositories.institutes.delete(entityId);
        }
        SyncService.broadcast('institutes', 'UPDATE', entityId);
        break;

      case 'settings':
        if (targetState) {
          restoredRecord = await repositories.settings.update(targetState);
        }
        SyncService.broadcast('settings', 'UPDATE', 'site_settings');
        break;

      case 'showcase':
      case 'showcase_gallery':
        if (targetState) {
          const exists = await repositories.showcase.findById(entityId);
          if (exists) {
            restoredRecord = await repositories.showcase.update(entityId, targetState);
          } else {
            restoredRecord = await repositories.showcase.create(targetState);
          }
        } else {
          await repositories.showcase.delete(entityId);
        }
        SyncService.broadcast('showcase', 'UPDATE', entityId);
        break;

      default:
        throw new ValidationError(`Entity ${entity} does not support automatic revision rollback.`);
    }

    await AuditService.logAction(
      actor,
      'DATA_REVISION_RESTORED',
      entity,
      `Admin restored ${entity} record ${entityId} to previous revision from ${item.timestamp}`,
      { resourceId: entityId, result: 'SUCCESS' }
    );

    return {
      success: true,
      message: `Record ${entityId} in ${entity} restored successfully.`,
      entity,
      entityId,
      restoredRecord,
    };
  }
}
