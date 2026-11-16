import crypto from 'node:crypto';
import { db } from '../persistence/json-database.js';
import { repositories } from '../repositories/index.js';
import { AuditService } from './AuditService.js';
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
    const users = db.getUsers();
    const inquiries = db.getInquiries();
    const applications = db.getApplications();
    const certificates = db.getCertificates();
    const activities = db.getActivities();
    const newsletters = db.getNewsletters();
    const programInterests = db.getProgramInterests();
    const feedback = db.getFeedback();
    const analytics = db.getAnalytics();
    const eventsGallery = db.getEvents();
    const team = db.getTeam();
    const courses = db.getCourses();

    const studentAccounts = users.filter((u: any) => (u.role || '').toLowerCase() === 'student').length;
    const employeeAccounts = users.filter((u: any) =>
      ['employee', 'staff', 'admin', 'super_admin'].includes((u.role || '').toLowerCase())
    ).length;

    const failedLogins = activities.filter(
      (item: any) => String(item.type || item.action).includes('LOGIN_FAILED')
    );
    const accountActivity = activities.filter((item: any) =>
      ['ACCOUNT_CREATED', 'USER_LOGIN', 'USER_LOGIN_FAILED'].includes(String(item.type || item.action))
    );

    const sanitizedUsers = users.map((u: any) => {
      const copy = { ...u };
      delete copy.passwordHash;
      return copy;
    });

    const rawSettings = db.getSettings() || {};
    const settings: SiteSettings = {
      heroStatNumber: rawSettings.heroStatNumber || '20,000+',
      heroStatLabel: rawSettings.heroStatLabel || 'Students Trained',
      governmentProtocol: rawSettings.governmentProtocol || 'Robotree Robotics LLP • Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity)',
      adminPasswordPermissionLocked: Boolean(rawSettings.adminPasswordPermissionLocked),
    };

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
        totalInstitutes: (db.getInstitutes ? db.getInstitutes() : []).length,
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
      activities,
      newsletters,
      programInterests,
      feedback,
      eventsGallery,
      showcaseGallery: db.getShowcase ? db.getShowcase() : [],
      team,
      courses,
      institutes: db.getInstitutes ? db.getInstitutes() : [],
      settings,
      products: db.getProducts ? db.getProducts() : [],
      orders: db.getOrders ? db.getOrders() : [],
      data: {
        users: sanitizedUsers,
        inquiries,
        applications,
        certificates,
        certs: certificates,
        activities,
        newsletters,
        programInterests,
        feedback,
        eventsGallery,
        team,
        courses,
        institutes: db.getInstitutes ? db.getInstitutes() : [],
        settings,
        products: db.getProducts ? db.getProducts() : [],
        orders: db.getOrders ? db.getOrders() : [],
      },
    };
  }

  public static getActivityLogs(): AuditLog[] {
    return db.getActivities() || [];
  }

  public static getSiteSettings(): SiteSettings {
    const rawSettings = db.getSettings() || {};
    return {
      heroStatNumber: rawSettings.heroStatNumber || '20,000+',
      heroStatLabel: rawSettings.heroStatLabel || 'Students Trained',
      governmentProtocol: rawSettings.governmentProtocol || 'Robotree Robotics LLP • Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity)',
      adminPasswordPermissionLocked: Boolean(rawSettings.adminPasswordPermissionLocked),
    };
  }

  public static async updateSiteSettings(dto: UpdateSettingsDto, actor: string = 'admin@robotree.org'): Promise<SiteSettings> {
    const current = db.getSettings() || {};

    if (dto.heroStatNumber !== undefined) {
      current.heroStatNumber = String(dto.heroStatNumber).trim().slice(0, 50);
    }
    if (dto.heroStatLabel !== undefined) {
      current.heroStatLabel = String(dto.heroStatLabel).trim().slice(0, 100);
    }
    if (dto.governmentProtocol !== undefined) {
      current.governmentProtocol = String(dto.governmentProtocol).trim().slice(0, 500);
    }

    db.saveSettings(current);

    await AuditService.logAction(
      actor,
      'SETTINGS_UPDATED',
      'settings',
      `Admin updated website content: Hero Stat "${current.heroStatNumber}" (${current.heroStatLabel})`,
      { resourceId: 'site-settings', result: 'SUCCESS' }
    );

    return {
      heroStatNumber: current.heroStatNumber,
      heroStatLabel: current.heroStatLabel,
      governmentProtocol: current.governmentProtocol,
    };
  }

  public static async createUser(dto: CreateUserDto, actor: string = 'admin@robotree.org'): Promise<Omit<User, 'passwordHash'>> {
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

    await AuditService.logAction(
      actor,
      'USER_CREATED',
      'users',
      `Admin created user: ${newUser.email} (${newUser.role})`,
      { resourceId: userId }
    );

    const sanitized = { ...newUser };
    delete (sanitized as any).passwordHash;
    return sanitized;
  }

  public static async deleteUser(id: string, actor: string = 'admin@robotree.org'): Promise<User> {
    const existing = await repositories.users.findById(id);
    if (!existing) {
      throw new NotFoundError('User account not found.');
    }
    await repositories.users.delete(id);
    await AuditService.logAction(
      actor,
      'USER_DELETED',
      'users',
      `Admin deleted user: ${existing.email} (${existing.role})`,
      { resourceId: id }
    );
    return existing;
  }

  public static async updateUserRole(id: string, role: string, actor: string = 'admin@robotree.org'): Promise<User> {
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
    await AuditService.logAction(
      actor,
      'USER_ROLE_UPDATED',
      'users',
      `Admin changed role of ${existing.email} to ${role}`,
      { resourceId: id }
    );
    return updated;
  }

  public static listInstitutes(): any[] {
    return db.getInstitutes ? db.getInstitutes() : [];
  }

  public static async createInstitute(payload: any, actor: string = 'admin@robotree.org'): Promise<any> {
    if (!payload.name) {
      throw new ValidationError('Institute name is required.');
    }
    const institutes = AdminService.listInstitutes();
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

    institutes.push(newInst);
    db.saveInstitutes(institutes);
    await AuditService.logAction(
      actor,
      'INSTITUTE_CREATED',
      'institutes',
      `Admin added partner institute: ${newInst.name} (${newInst.tier})`,
      { resourceId: id }
    );
    return newInst;
  }

  public static async updateInstitute(id: string, payload: any, actor: string = 'admin@robotree.org'): Promise<any> {
    if (!id) {
      throw new ValidationError('Institute ID is required.');
    }
    const institutes = AdminService.listInstitutes();
    const index = institutes.findIndex((i: any) => String(i.id) === String(id));
    if (index === -1) {
      throw new NotFoundError('Partner institute not found.');
    }

    const current = institutes[index];
    const tags = payload.tags !== undefined
      ? (Array.isArray(payload.tags) ? payload.tags : (typeof payload.tags === 'string' ? payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []))
      : current.tags;

    const updated = {
      ...current,
      name: payload.name !== undefined ? payload.name.trim() : current.name,
      tier: payload.tier !== undefined ? payload.tier.trim() : current.tier,
      category: payload.category !== undefined ? payload.category.trim() : current.category,
      location: payload.location !== undefined ? payload.location.trim() : current.location,
      logo: payload.logo !== undefined ? payload.logo.trim() : current.logo,
      description: payload.description !== undefined ? payload.description.trim() : current.description,
      tags,
      status: payload.status !== undefined ? payload.status.trim() : current.status,
      updatedAt: new Date().toISOString()
    };

    institutes[index] = updated;
    db.saveInstitutes(institutes);
    await AuditService.logAction(
      actor,
      'INSTITUTE_UPDATED',
      'institutes',
      `Admin updated partner institute: ${updated.name}`,
      { resourceId: id }
    );
    return updated;
  }

  public static async deleteInstitute(id: string, actor: string = 'admin@robotree.org'): Promise<any> {
    if (!id) {
      throw new ValidationError('Institute ID is required.');
    }
    const institutes = AdminService.listInstitutes();
    const index = institutes.findIndex((i: any) => String(i.id) === String(id));
    if (index === -1) {
      throw new NotFoundError('Partner institute not found.');
    }

    const removed = institutes.splice(index, 1)[0];
    db.saveInstitutes(institutes);
    await AuditService.logAction(
      actor,
      'INSTITUTE_DELETED',
      'institutes',
      `Admin removed partner institute: ${removed.name}`,
      { resourceId: id }
    );
    return removed;
  }
}
