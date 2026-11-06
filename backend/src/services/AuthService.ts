import crypto from 'node:crypto';
import { repositories } from '../repositories/index.js';
import { hashPassword, verifyPassword } from '../security/hasher.js';
import { timingSafeEqual } from '../security/timingSafe.js';
import { generateSecureToken } from '../security/tokens.js';
import { env } from '../config/env.js';
import { User, Session, Role } from '../types/index.js';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../errors/AppError.js';
import { db } from '../persistence/json-database.js';
import { AuditService } from './AuditService.js';

export class AuthService {
  public static async register(
    name: string,
    email: string,
    password: string,
    role?: string
  ): Promise<{ user: User; session: Session }> {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await repositories.users.findByEmail(cleanEmail);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = hashPassword(password);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const userRole = (role || 'Student') as Role;

    const newUser = await repositories.users.create({
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: userRole,
      failedLoginAttempts: 0,
      isLocked: false,
    });

    const session = await this.createSession(newUser);
    await AuditService.logAction(newUser.email, 'ACCOUNT_CREATED', 'users', `User registered: ${newUser.name}`, {
      resourceId: newUser.id,
    });

    return { user: newUser, session };
  }

  public static async login(
    email: string,
    password: string,
    requestedRole?: string
  ): Promise<{ user: User; session: Session }> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await repositories.users.findByEmail(cleanEmail);

    if (!user) {
      await AuditService.logAction(cleanEmail, 'USER_LOGIN_FAILED', 'users', 'User not found', { result: 'FAILURE' });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (requestedRole && user.role.toLowerCase() !== requestedRole.toLowerCase()) {
      await AuditService.logAction(cleanEmail, 'USER_LOGIN_FAILED', 'users', 'Role mismatch', { result: 'FAILURE' });
      throw new UnauthorizedError('Invalid email or password for requested portal');
    }

    if (user.isLocked && user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      await AuditService.logAction(user.email, 'LOGIN_BLOCKED', 'users', 'Account locked', { result: 'FAILURE' });
      throw new UnauthorizedError('Account is temporarily locked due to excessive failed attempts. Please try again later.');
    }

    const verification = verifyPassword(password, user.passwordHash);

    if (!verification.valid) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const updates: Partial<User> = { failedLoginAttempts: attempts };

      if (attempts >= 5) {
        updates.isLocked = true;
        updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }

      await repositories.users.update(user.id, updates);
      await AuditService.logAction(user.email, 'USER_LOGIN_FAILED', 'users', `Invalid password (attempt ${attempts})`, {
        resourceId: user.id,
        result: 'FAILURE',
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Auto-rehash if outdated iteration or format
    if (verification.needsRehash) {
      const newHash = hashPassword(password);
      await repositories.users.update(user.id, { passwordHash: newHash });
    }

    if (user.failedLoginAttempts || user.isLocked) {
      await repositories.users.update(user.id, { failedLoginAttempts: 0, isLocked: false, lockUntil: undefined });
    }

    const session = await this.createSession(user);
    await AuditService.logAction(user.email, 'USER_LOGIN', 'users', 'Successful login', { resourceId: user.id });

    return { user, session };
  }

  // In-memory rate limiting and brute force protection for admin operations
  private static failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

  public static checkBruteForceLockout(key: string, maxAttempts = 5, lockDurationMs = 15 * 60 * 1000): void {
    const record = this.failedAttempts.get(key);
    if (record) {
      if (Date.now() < record.lockedUntil) {
        const remainingMinutes = Math.ceil((record.lockedUntil - Date.now()) / 60000);
        throw new UnauthorizedError(
          `Security Lockout: Too many failed administrative attempts. Access is locked for ${remainingMinutes} more minute(s).`
        );
      }
      if (Date.now() >= record.lockedUntil && record.count >= maxAttempts) {
        this.failedAttempts.delete(key);
      }
    }
  }

  public static recordFailedAttempt(key: string, maxAttempts = 5, lockDurationMs = 15 * 60 * 1000): void {
    const record = this.failedAttempts.get(key) || { count: 0, lockedUntil: 0 };
    record.count += 1;
    if (record.count >= maxAttempts) {
      record.lockedUntil = Date.now() + lockDurationMs;
    }
    this.failedAttempts.set(key, record);
  }

  public static resetFailedAttempts(key: string): void {
    this.failedAttempts.delete(key);
  }

  public static verifyAdminPasscode(passcode: string): boolean {
    const settings = db.getSettings() || {};
    
    // 1. Check strong PBKDF2 / Argon2 cryptographic hash
    if (settings.adminPasscodeHash) {
      const result = verifyPassword(passcode, settings.adminPasscodeHash);
      return result.valid;
    }

    // 2. Legacy plaintext migration (if present in settings or env)
    const expectedPlain = (typeof settings.adminPasscode === 'string' && settings.adminPasscode.length >= 6)
      ? settings.adminPasscode
      : (process.env.ADMIN_PASSCODE || env.ADMIN_PASSCODE || 'Aniket4515');

    const matches = timingSafeEqual(passcode, expectedPlain);
    if (matches) {
      // Auto-migrate to secure salted hash immediately and wipe plaintext
      try {
        settings.adminPasscodeHash = hashPassword(passcode);
        delete settings.adminPasscode;
        db.saveSettings(settings);
      } catch (_) {}
    }
    return matches;
  }

  public static verifyAdminPermissionKey(inputKey: string): boolean {
    const settings = db.getSettings() || {};

    // 1. Check strong PBKDF2 cryptographic hash
    if (settings.adminPermissionKeyHash) {
      const result = verifyPassword(inputKey, settings.adminPermissionKeyHash);
      return result.valid;
    }

    // 2. Legacy plaintext migration (if present in settings or env)
    const expectedPlain = (typeof settings.adminPermissionKey === 'string' && settings.adminPermissionKey.trim().length > 0)
      ? settings.adminPermissionKey.trim()
      : (process.env.ADMIN_PERMISSION_KEY || 'GoluSingh99');

    const matches = timingSafeEqual(inputKey, expectedPlain);
    if (matches) {
      // Auto-migrate to secure salted hash immediately and wipe plaintext
      try {
        settings.adminPermissionKeyHash = hashPassword(inputKey);
        delete settings.adminPermissionKey;
        db.saveSettings(settings);
      } catch (_) {}
    }
    return matches;
  }

  public static getAdminPasscode(): string {
    try {
      const settings = db.getSettings();
      if (settings && typeof settings.adminPasscode === 'string' && settings.adminPasscode.length >= 6) {
        return settings.adminPasscode;
      }
    } catch {
      // Fallback to environment variable
    }
    return process.env.ADMIN_PASSCODE || env.ADMIN_PASSCODE || 'Aniket4515';
  }

  public static async adminLogin(passcode: string): Promise<{ token: string; role: Role }> {
    const lockoutKey = 'admin_login';
    this.checkBruteForceLockout(lockoutKey, 5, 15 * 60 * 1000);

    const isMatch = this.verifyAdminPasscode(passcode);
    if (!isMatch) {
      this.recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
      await AuditService.logAction('UNKNOWN', 'ADMIN_LOGIN_FAILED', 'admin', 'Invalid passcode attempt', { result: 'FAILURE' });
      throw new UnauthorizedError('Invalid admin passcode');
    }

    this.resetFailedAttempts(lockoutKey);

    const adminToken = generateSecureToken(32);
    const session: Session = {
      id: adminToken,
      userId: 'admin_root',
      role: 'SUPER_ADMIN',
      email: 'admin@robotree.org',
      name: 'System Administrator',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
    };

    await repositories.users.createSession(session);
    await AuditService.logAction('admin@robotree.org', 'ADMIN_LOGIN_SUCCESS', 'admin', 'Admin session created');

    return { token: adminToken, role: 'SUPER_ADMIN' };
  }

  public static getAdminPermissionStatus(): { permissionLocked: boolean; adminPermissionKeyConfigured: boolean } {
    const settings = db.getSettings() || {};
    return {
      permissionLocked: Boolean(settings.adminPasswordPermissionLocked),
      adminPermissionKeyConfigured: Boolean(
        settings.adminPermissionKeyHash ||
        settings.adminPermissionKey ||
        process.env.ADMIN_PERMISSION_KEY
      ),
    };
  }

  public static getAdminPermissionKey(): string {
    const settings = db.getSettings() || {};
    if (settings && typeof settings.adminPermissionKey === 'string' && settings.adminPermissionKey.trim().length > 0) {
      return settings.adminPermissionKey.trim();
    }
    return process.env.ADMIN_PERMISSION_KEY || 'GoluSingh99';
  }

  public static async toggleAdminPasswordPermissionLock(
    locked: boolean,
    permissionKey?: string,
    actor = 'admin@robotree.org'
  ): Promise<{ success: boolean; permissionLocked: boolean; message: string }> {
    const lockoutKey = 'admin_permission_toggle';
    this.checkBruteForceLockout(lockoutKey, 5, 15 * 60 * 1000);

    const currentSettings = db.getSettings() || {};

    if (!locked && currentSettings.adminPasswordPermissionLocked) {
      if (!permissionKey || !this.verifyAdminPermissionKey(permissionKey)) {
        this.recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
        throw new UnauthorizedError('Permission Denied: Invalid Admin Permission Key. You must enter the correct Admin Permission Key to unlock password changes.');
      }
    } else if (permissionKey) {
      const matchesKey = this.verifyAdminPermissionKey(permissionKey);
      if (!matchesKey) {
        this.recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
        throw new UnauthorizedError('Permission Denied: Invalid Admin Permission Key.');
      }
    }

    this.resetFailedAttempts(lockoutKey);

    currentSettings.adminPasswordPermissionLocked = locked;
    currentSettings.adminPermissionUpdatedAt = new Date().toISOString();
    db.saveSettings(currentSettings);

    const action = locked ? 'ADMIN_PASSWORD_PERMISSION_LOCKED' : 'ADMIN_PASSWORD_PERMISSION_UNLOCKED';
    await AuditService.logAction(
      actor,
      action,
      'admin',
      `Admin password modification permission set to ${locked ? 'LOCKED' : 'UNLOCKED'}`
    );

    return {
      success: true,
      permissionLocked: locked,
      message: locked
        ? 'Admin password modification has been LOCKED. Password cannot be changed without unlocking permission.'
        : 'Admin password modification has been UNLOCKED. Changes are now permitted with admin authorization.',
    };
  }

  public static async changeAdminPassword(
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
    actor = 'admin@robotree.org',
    adminPermissionKey?: string,
    adminPermissionConfirmed?: boolean
  ): Promise<{ success: boolean; message: string }> {
    const lockoutKey = 'admin_password_change';
    this.checkBruteForceLockout(lockoutKey, 5, 15 * 60 * 1000);

    if (!oldPassword || !newPassword || !confirmPassword) {
      throw new ValidationError('Current password, new password, and confirmation are required.');
    }

    if (adminPermissionConfirmed === false) {
      throw new ValidationError('Permission Denied: You must confirm you have permission from the Administrator before changing the admin password.');
    }

    const currentSettings = db.getSettings() || {};

    // 1. Guard against locked admin password permission
    if (currentSettings.adminPasswordPermissionLocked === true) {
      const isKeyMatch = adminPermissionKey && this.verifyAdminPermissionKey(adminPermissionKey);

      if (!isKeyMatch) {
        this.recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
        await AuditService.logAction(
          actor,
          'ADMIN_PASSWORD_CHANGE_BLOCKED',
          'admin',
          'Attempted change while admin permission locked',
          { result: 'FAILURE' }
        );
        throw new UnauthorizedError(
          'Permission Denied: Admin password modifications are currently locked by the System Administrator. Unlock permission first to proceed.'
        );
      }
    }

    // 2. Validate admin permission key if supplied
    if (adminPermissionKey !== undefined && adminPermissionKey !== '') {
      const isKeyMatch = this.verifyAdminPermissionKey(adminPermissionKey);
      if (!isKeyMatch) {
        this.recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
        await AuditService.logAction(
          actor,
          'ADMIN_PASSWORD_CHANGE_FAILED',
          'admin',
          'Invalid Admin Permission Key',
          { result: 'FAILURE' }
        );
        throw new UnauthorizedError(
          'Permission Denied: Invalid Admin Permission Key. Changing the admin password without valid admin permission is strictly prohibited.'
        );
      }
    }

    // 3. Verify current old password using cryptographic hash verification
    const isOldMatch = this.verifyAdminPasscode(oldPassword);
    if (!isOldMatch) {
      this.recordFailedAttempt(lockoutKey, 5, 15 * 60 * 1000);
      await AuditService.logAction(actor, 'ADMIN_PASSWORD_CHANGE_FAILED', 'admin', 'Old password mismatch', { result: 'FAILURE' });
      throw new UnauthorizedError('The current old password you entered is incorrect.');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New admin password must be at least 8 characters long.');
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError('New password and confirmation password do not match.');
    }

    if (newPassword === oldPassword) {
      throw new ValidationError('New password cannot be the same as your old password.');
    }

    // 4. Securely store PBKDF2 210,000 rounds salted cryptographic hash & wipe plaintext
    currentSettings.adminPasscodeHash = hashPassword(newPassword);
    delete currentSettings.adminPasscode;
    currentSettings.adminPasswordUpdatedAt = new Date().toISOString();
    db.saveSettings(currentSettings);

    process.env.ADMIN_PASSCODE = newPassword;

    this.resetFailedAttempts(lockoutKey);

    await AuditService.logAction(actor, 'ADMIN_PASSWORD_CHANGED', 'admin', 'Admin password updated with verified admin permission and cryptographic hashing');

    return {
      success: true,
      message: 'Admin password updated successfully with verified admin permission!'
    };
  }

  public static async createSession(user: User): Promise<Session> {
    const sessionId = generateSecureToken(32);
    const session: Session = {
      id: sessionId,
      userId: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date().toISOString(),
    };
    return repositories.users.createSession(session);
  }

  public static async getSession(sessionId: string): Promise<Session | null> {
    return repositories.users.findSession(sessionId);
  }

  public static async logout(sessionId: string): Promise<void> {
    await repositories.users.deleteSession(sessionId);
  }

  public static async resetPassword(email: string, newPassword: string): Promise<User> {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'admin@robotree.org') {
      throw new UnauthorizedError('Admin password cannot be reset.');
    }
    const user = await repositories.users.findByEmail(cleanEmail);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      throw new UnauthorizedError('Admin accounts cannot be reset via this form.');
    }

    const newHash = hashPassword(newPassword);
    const updated = await repositories.users.update(user.id, {
      passwordHash: newHash,
      failedLoginAttempts: 0,
      isLocked: false,
    });

    await repositories.users.deleteUserSessions(user.id);
    await AuditService.logAction(user.email, 'PASSWORD_RESET', 'users', 'Password reset successfully', { resourceId: user.id });

    return updated!;
  }

  public static async deleteAccount(userId: string, passwordConfirm: string): Promise<boolean> {
    const user = await repositories.users.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const verification = verifyPassword(passwordConfirm, user.passwordHash);
    if (!verification.valid) {
      throw new UnauthorizedError('Invalid password confirmation');
    }

    await repositories.users.deleteUserSessions(userId);
    const success = await repositories.users.delete(userId);
    await AuditService.logAction(user.email, 'ACCOUNT_DELETED', 'users', 'User erased account under GDPR', { resourceId: user.id });
    return success;
  }
}
