import pg from 'pg';
import crypto from 'node:crypto';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { ICertificateRepository } from '../interfaces/ICertificateRepository.js';
import { ICourseRepository } from '../interfaces/ICourseRepository.js';
import { ITeamRepository } from '../interfaces/ITeamRepository.js';
import { IEventRepository } from '../interfaces/IEventRepository.js';
import { IAuditRepository } from '../interfaces/IAuditRepository.js';
import { IInquiryRepository, Inquiry } from '../interfaces/IInquiryRepository.js';
import { IProductRepository } from '../interfaces/IProductRepository.js';
import {
  User,
  Session,
  Certificate,
  Course,
  TeamMember,
  EventGalleryItem,
  AuditLog,
  Product,
  StoreOrder,
} from '../../types/index.js';
import { env } from '../../config/env.js';
import { Logger } from '../../telemetry/logger.js';

const { Pool } = pg;

export class PostgresConnection {
  private static pool: pg.Pool | null = null;

  public static getPool(): pg.Pool | null {
    const connectionString = env.DATABASE_URL;
    if (!connectionString) return null;

    if (!this.pool) {
      const isSupabaseOrRemote =
        connectionString.includes('supabase.co') ||
        connectionString.includes('supabase.com') ||
        connectionString.includes('pooler.supabase.com') ||
        connectionString.includes('sslmode=') ||
        env.NODE_ENV === 'production';

      this.pool = new Pool({
        connectionString,
        max: isSupabaseOrRemote ? 10 : 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: isSupabaseOrRemote ? { rejectUnauthorized: true } : undefined,
      });

      this.pool.on('error', (err) => {
        Logger.error('Unexpected PostgreSQL pool error', { details: err.message });
      });
    }
    return this.pool;
  }

  public static async isHealthy(): Promise<boolean> {
    const pool = this.getPool();
    if (!pool) return false;
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  public static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// ==============================================================================
// 1. Users & Sessions Repository
// ==============================================================================
export class PostgresUserRepository implements IUserRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async findByEmail(email: string): Promise<User | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT id, email, name, password_hash as "passwordHash", role,
              created_at as "createdAt", updated_at as "updatedAt",
              is_locked as "isLocked", failed_login_attempts as "failedLoginAttempts",
              lock_until as "lockUntil", reset_token as "resetToken",
              reset_token_expires as "resetTokenExpires"
       FROM users WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL`,
      [email.trim()]
    );
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT id, email, name, password_hash as "passwordHash", role,
              created_at as "createdAt", updated_at as "updatedAt",
              is_locked as "isLocked", failed_login_attempts as "failedLoginAttempts",
              lock_until as "lockUntil", reset_token as "resetToken",
              reset_token_expires as "resetTokenExpires"
       FROM users WHERE id::text = $1 AND deleted_at IS NULL`,
      [id]
    );
    return res.rows[0] || null;
  }

  async create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    if (!this.pool) throw new Error('Database pool not connected');
    const res = await this.pool.query(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, password_hash as "passwordHash", role,
                 created_at as "createdAt", updated_at as "updatedAt"`,
      [user.email.toLowerCase().trim(), user.name.trim(), user.passwordHash, user.role || 'STUDENT']
    );
    return res.rows[0];
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    if (!this.pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.passwordHash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(updates.passwordHash); }
    if (updates.role !== undefined) { fields.push(`role = $${idx++}`); values.push(updates.role); }
    if (updates.isLocked !== undefined) { fields.push(`is_locked = $${idx++}`); values.push(updates.isLocked); }
    if (updates.failedLoginAttempts !== undefined) { fields.push(`failed_login_attempts = $${idx++}`); values.push(updates.failedLoginAttempts); }
    if (updates.lockUntil !== undefined) { fields.push(`lock_until = $${idx++}`); values.push(updates.lockUntil); }
    if (updates.resetToken !== undefined) { fields.push(`reset_token = $${idx++}`); values.push(updates.resetToken); }
    if (updates.resetTokenExpires !== undefined) { fields.push(`reset_token_expires = $${idx++}`); values.push(updates.resetTokenExpires); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id::text = $${idx}
       RETURNING id, email, name, password_hash as "passwordHash", role,
                 created_at as "createdAt", updated_at as "updatedAt",
                 is_locked as "isLocked"`,
      values
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id::text = $1',
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async list(): Promise<User[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT id, email, name, role, created_at as "createdAt", updated_at as "updatedAt"
       FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC`
    );
    return res.rows;
  }

  async createSession(session: Session): Promise<Session> {
    if (!this.pool) return session;
    await this.pool.query(
      `INSERT INTO sessions (id, user_id, role, email, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET last_active = CURRENT_TIMESTAMP, expires_at = EXCLUDED.expires_at`,
      [session.id, session.userId, session.role, session.email, session.expiresAt]
    );
    return session;
  }

  async findSession(sessionId: string): Promise<Session | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT s.id, s.user_id as "userId", s.role, s.email, u.name,
              s.expires_at as "expiresAt", s.created_at as "createdAt", s.last_active as "lastActive"
       FROM sessions s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
      [sessionId]
    );
    return res.rows[0] || null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteUserSessions(userId: string): Promise<void> {
    if (!this.pool) return;
    await this.pool.query('DELETE FROM sessions WHERE user_id::text = $1', [userId]);
  }
}

// ==============================================================================
// 2. Certificates Repository
// ==============================================================================
export class PostgresCertificateRepository implements ICertificateRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async findByCode(code: string): Promise<Certificate | null> {
    if (!this.pool) return null;
    const clean = code.trim().toLowerCase();
    const res = await this.pool.query(
      `SELECT id, code, student_name as "studentName", student_email as "studentEmail",
              course_title as "course", course_title as "courseTitle",
              issue_date::text as "issueDate", status, verification_hash as "verificationHash",
              issuer, revoked_at as "revokedAt", revoked_reason as "revokedReason",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM certificates
       WHERE LOWER(code) = $1 OR LOWER(id) = $1 OR LOWER(student_name) = $1
       LIMIT 1`,
      [clean]
    );
    return res.rows[0] || null;
  }

  async findById(id: string): Promise<Certificate | null> {
    return this.findByCode(id);
  }

  async list(): Promise<Certificate[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT id, code, student_name as "studentName", student_email as "studentEmail",
              course_title as "course", course_title as "courseTitle",
              issue_date::text as "issueDate", status, verification_hash as "verificationHash",
              issuer, revoked_at as "revokedAt", revoked_reason as "revokedReason",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM certificates ORDER BY created_at DESC`
    );
    return res.rows;
  }

  async create(cert: Omit<Certificate, 'createdAt' | 'updatedAt'>): Promise<Certificate> {
    if (!this.pool) throw new Error('Database pool not connected');
    const id = cert.id || cert.code || `RBT-${Date.now()}`;
    const code = cert.code || id;
    const res = await this.pool.query(
      `INSERT INTO certificates (id, code, student_name, student_email, course_title, issue_date, status, verification_hash, issuer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, code, student_name as "studentName", student_email as "studentEmail",
                 course_title as "course", course_title as "courseTitle",
                 issue_date::text as "issueDate", status, verification_hash as "verificationHash",
                 issuer, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        id,
        code,
        cert.studentName,
        cert.studentEmail || null,
        cert.courseTitle || cert.course,
        cert.issueDate,
        cert.status || 'ISSUED',
        cert.verificationHash || crypto.createHash('sha256').update(id).digest('hex'),
        cert.issuer || 'Robotree Academic Directorate',
      ]
    );
    return res.rows[0];
  }

  async update(id: string, updates: Partial<Certificate>): Promise<Certificate | null> {
    if (!this.pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.studentName) { fields.push(`student_name = $${idx++}`); values.push(updates.studentName); }
    if (updates.studentEmail !== undefined) { fields.push(`student_email = $${idx++}`); values.push(updates.studentEmail); }
    if (updates.courseTitle || updates.course) { fields.push(`course_title = $${idx++}`); values.push(updates.courseTitle || updates.course); }
    if (updates.status) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.revokedAt !== undefined) { fields.push(`revoked_at = $${idx++}`); values.push(updates.revokedAt); }
    if (updates.revokedReason !== undefined) { fields.push(`revoked_reason = $${idx++}`); values.push(updates.revokedReason); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await this.pool.query(
      `UPDATE certificates SET ${fields.join(', ')} WHERE id = $${idx} OR code = $${idx}
       RETURNING id, code, student_name as "studentName", student_email as "studentEmail",
                 course_title as "course", course_title as "courseTitle",
                 issue_date::text as "issueDate", status, verification_hash as "verificationHash",
                 issuer, revoked_at as "revokedAt", revoked_reason as "revokedReason",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  }

  async revoke(id: string, reason = 'Administrative revocation'): Promise<Certificate | null> {
    return this.update(id, {
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    });
  }

  async reinstate(id: string): Promise<Certificate | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `UPDATE certificates
       SET status = 'ISSUED', revoked_at = NULL, revoked_reason = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 OR code = $1
       RETURNING id, code, student_name as "studentName", student_email as "studentEmail",
                 course_title as "course", course_title as "courseTitle",
                 issue_date::text as "issueDate", status, verification_hash as "verificationHash",
                 issuer, created_at as "createdAt", updated_at as "updatedAt"`,
      [id]
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query('DELETE FROM certificates WHERE id = $1 OR code = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

// ==============================================================================
// 3. Courses Repository
// ==============================================================================
export class PostgresCourseRepository implements ICourseRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async list(): Promise<Course[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT id, title, category, price::float as price, currency, duration, level, image, description
       FROM courses WHERE is_active = TRUE ORDER BY created_at DESC`
    );
    return res.rows.map((row) => ({ ...row, modules: [] }));
  }

  async findById(id: string): Promise<Course | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT id, title, category, price::float as price, currency, duration, level, image, description
       FROM courses WHERE id = $1 AND is_active = TRUE`,
      [id]
    );
    if (!res.rows[0]) return null;
    return { ...res.rows[0], modules: [] };
  }

  async create(course: Course): Promise<Course> {
    if (!this.pool) throw new Error('Database pool not connected');
    const res = await this.pool.query(
      `INSERT INTO courses (id, title, category, price, currency, duration, level, image, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, title, category, price::float as price, currency, duration, level, image, description`,
      [
        course.id,
        course.title,
        course.category,
        course.price || 0,
        course.currency || 'INR',
        course.duration || 'Flexible',
        course.level || 'Beginner',
        course.image || '',
        course.description || '',
      ]
    );
    return { ...res.rows[0], modules: course.modules || [] };
  }

  async update(id: string, updates: Partial<Course>): Promise<Course | null> {
    if (!this.pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.title) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.category) { fields.push(`category = $${idx++}`); values.push(updates.category); }
    if (updates.price !== undefined) { fields.push(`price = $${idx++}`); values.push(updates.price); }
    if (updates.currency) { fields.push(`currency = $${idx++}`); values.push(updates.currency); }
    if (updates.duration) { fields.push(`duration = $${idx++}`); values.push(updates.duration); }
    if (updates.level) { fields.push(`level = $${idx++}`); values.push(updates.level); }
    if (updates.image !== undefined) { fields.push(`image = $${idx++}`); values.push(updates.image); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await this.pool.query(
      `UPDATE courses SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, title, category, price::float as price, currency, duration, level, image, description`,
      values
    );
    if (!res.rows[0]) return null;
    return { ...res.rows[0], modules: [] };
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query('UPDATE courses SET is_active = FALSE WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

// ==============================================================================
// 4. Team Members Repository
// ==============================================================================
export class PostgresTeamRepository implements ITeamRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async list(): Promise<TeamMember[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT id, name, role, department, category, image, email, responsibilities, qualification, experience, skills
       FROM team_members WHERE is_active = TRUE ORDER BY id ASC`
    );
    return res.rows.map((m) => ({
      ...m,
      skills: Array.isArray(m.skills) ? m.skills : [],
    }));
  }

  async findById(id: number | string): Promise<TeamMember | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT id, name, role, department, category, image, email, responsibilities, qualification, experience, skills
       FROM team_members WHERE id::text = $1 AND is_active = TRUE`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    const m = res.rows[0];
    return { ...m, skills: Array.isArray(m.skills) ? m.skills : [] };
  }

  async create(member: TeamMember): Promise<TeamMember> {
    if (!this.pool) throw new Error('Database pool not connected');
    const res = await this.pool.query(
      `INSERT INTO team_members (name, role, department, category, image, email, responsibilities, qualification, experience, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, role, department, category, image, email, responsibilities, qualification, experience, skills`,
      [
        member.name,
        member.role,
        member.department || 'Training',
        member.category || 'operations',
        member.image || '',
        member.email || '',
        member.responsibilities || '',
        member.qualification || '',
        member.experience || '',
        member.skills || [],
      ]
    );
    return res.rows[0];
  }

  async update(id: number | string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
    if (!this.pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.role) { fields.push(`role = $${idx++}`); values.push(updates.role); }
    if (updates.department) { fields.push(`department = $${idx++}`); values.push(updates.department); }
    if (updates.category) { fields.push(`category = $${idx++}`); values.push(updates.category); }
    if (updates.image !== undefined) { fields.push(`image = $${idx++}`); values.push(updates.image); }
    if (updates.email !== undefined) { fields.push(`email = $${idx++}`); values.push(updates.email); }
    if (updates.responsibilities !== undefined) { fields.push(`responsibilities = $${idx++}`); values.push(updates.responsibilities); }
    if (updates.qualification !== undefined) { fields.push(`qualification = $${idx++}`); values.push(updates.qualification); }
    if (updates.experience !== undefined) { fields.push(`experience = $${idx++}`); values.push(updates.experience); }
    if (updates.skills !== undefined) { fields.push(`skills = $${idx++}`); values.push(updates.skills); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(String(id));

    const res = await this.pool.query(
      `UPDATE team_members SET ${fields.join(', ')} WHERE id::text = $${idx}
       RETURNING id, name, role, department, category, image, email, responsibilities, qualification, experience, skills`,
      values
    );
    return res.rows[0] || null;
  }

  async delete(id: number | string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query('UPDATE team_members SET is_active = FALSE WHERE id::text = $1', [String(id)]);
    return (res.rowCount ?? 0) > 0;
  }
}

// ==============================================================================
// 5. Events Gallery Repository
// ==============================================================================
export class PostgresEventRepository implements IEventRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async list(): Promise<EventGalleryItem[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT e.id, e.title, e.category, e.institution, e.event_date::text as "date",
              e.description, e.cover_image as "image", e.tags,
              COALESCE(array_agg(ei.image_url ORDER BY ei.display_order) FILTER (WHERE ei.image_url IS NOT NULL), '{}') as "images"
       FROM events e
       LEFT JOIN event_images ei ON ei.event_id = e.id
       WHERE e.deleted_at IS NULL
       GROUP BY e.id
       ORDER BY e.event_date DESC`
    );
    return res.rows.map((ev) => ({
      ...ev,
      tags: Array.isArray(ev.tags) ? ev.tags : [],
      images: Array.isArray(ev.images) && ev.images.length > 0 ? ev.images : (ev.image ? [ev.image] : []),
    }));
  }

  async findById(id: string): Promise<EventGalleryItem | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT e.id, e.title, e.category, e.institution, e.event_date::text as "date",
              e.description, e.cover_image as "image", e.tags,
              COALESCE(array_agg(ei.image_url ORDER BY ei.display_order) FILTER (WHERE ei.image_url IS NOT NULL), '{}') as "images"
       FROM events e
       LEFT JOIN event_images ei ON ei.event_id = e.id
       WHERE e.id = $1 AND e.deleted_at IS NULL
       GROUP BY e.id`,
      [id]
    );
    if (!res.rows[0]) return null;
    const ev = res.rows[0];
    return {
      ...ev,
      tags: Array.isArray(ev.tags) ? ev.tags : [],
      images: Array.isArray(ev.images) && ev.images.length > 0 ? ev.images : (ev.image ? [ev.image] : []),
    };
  }

  async create(event: EventGalleryItem): Promise<EventGalleryItem> {
    if (!this.pool) throw new Error('Database pool not connected');
    const id = event.id || `EVT-${Date.now()}`;
    await this.pool.query(
      `INSERT INTO events (id, title, category, institution, event_date, description, cover_image, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = CURRENT_TIMESTAMP`,
      [
        id,
        event.title,
        event.category || 'School Robotics',
        event.institution || 'Partner Institution',
        event.date || new Date().toISOString().split('T')[0],
        event.description || '',
        event.image || (event.images && event.images[0]) || '',
        event.tags || [],
      ]
    );

    if (event.images && event.images.length > 0) {
      for (let i = 0; i < event.images.length; i++) {
        await this.pool.query(
          `INSERT INTO event_images (event_id, image_url, display_order)
           VALUES ($1, $2, $3)`,
          [id, event.images[i], i]
        );
      }
    }
    return (await this.findById(id)) || event;
  }

  async update(id: string, updates: Partial<EventGalleryItem>): Promise<EventGalleryItem | null> {
    if (!this.pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.title) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.category) { fields.push(`category = $${idx++}`); values.push(updates.category); }
    if (updates.institution) { fields.push(`institution = $${idx++}`); values.push(updates.institution); }
    if (updates.date) { fields.push(`event_date = $${idx++}`); values.push(updates.date); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.image !== undefined) { fields.push(`cover_image = $${idx++}`); values.push(updates.image); }
    if (updates.tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(updates.tags); }

    if (fields.length > 0) {
      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      await this.pool.query(`UPDATE events SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    }

    if (updates.images) {
      await this.pool.query('DELETE FROM event_images WHERE event_id = $1', [id]);
      for (let i = 0; i < updates.images.length; i++) {
        await this.pool.query(
          `INSERT INTO event_images (event_id, image_url, display_order) VALUES ($1, $2, $3)`,
          [id, updates.images[i], i]
        );
      }
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query('UPDATE events SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deletePhoto(eventId: string, photoUrl: string): Promise<EventGalleryItem | null> {
    if (!this.pool) return null;
    await this.pool.query('DELETE FROM event_images WHERE event_id = $1 AND image_url = $2', [eventId, photoUrl]);
    return this.findById(eventId);
  }
}

// ==============================================================================
// 6. Immutable Audit Logs Repository
// ==============================================================================
export class PostgresAuditRepository implements IAuditRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const id = `AUD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const fullEntry: AuditLog = { ...entry, id, timestamp };

    if (!this.pool) return fullEntry;
    try {
      await this.pool.query(
        `INSERT INTO audit_logs (id, actor, action, resource, resource_id, request_id, ip_address, user_agent, result, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          entry.actor || 'system',
          entry.action,
          entry.resource,
          entry.resourceId || null,
          entry.requestId || null,
          entry.ip || null,
          entry.userAgent || null,
          entry.result || 'SUCCESS',
          entry.details || null,
        ]
      );
    } catch (err: any) {
      Logger.error('Postgres audit log error', { details: err.message });
    }
    return fullEntry;
  }

  async list(limit = 100): Promise<AuditLog[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT id, timestamp::text as "timestamp", actor, action, resource,
              resource_id as "resourceId", request_id as "requestId",
              ip_address as "ip", user_agent as "userAgent", result, details
       FROM audit_logs ORDER BY timestamp DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

// ==============================================================================
// 7. Inquiries & Contact Leads Repository
// ==============================================================================
export class PostgresInquiryRepository implements IInquiryRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async create(inquiry: Omit<Inquiry, 'createdAt'>): Promise<Inquiry> {
    const id = inquiry.id || `INQ-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const fullInquiry: Inquiry = { ...inquiry, id, createdAt };

    if (!this.pool) return fullInquiry;
    const res = await this.pool.query(
      `INSERT INTO inquiries (id, name, email, phone, interest, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, interest, message, status, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        id,
        inquiry.name,
        inquiry.email,
        inquiry.phone || null,
        inquiry.interest || inquiry.subject || null,
        inquiry.message || '',
        inquiry.status || 'NEW',
      ]
    );
    return res.rows[0];
  }

  async list(): Promise<Inquiry[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT id, name, email, phone, interest, message, status, created_at as "createdAt", updated_at as "updatedAt"
       FROM inquiries ORDER BY created_at DESC`
    );
    return res.rows;
  }

  async findById(id: string): Promise<Inquiry | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT id, name, email, phone, interest, message, status, created_at as "createdAt", updated_at as "updatedAt"
       FROM inquiries WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async update(id: string, updates: Partial<Inquiry>): Promise<Inquiry | null> {
    if (!this.pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.status) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.notes !== undefined) { fields.push(`message = $${idx++}`); values.push(updates.notes); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await this.pool.query(
      `UPDATE inquiries SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, name, email, phone, interest, message, status, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query('DELETE FROM inquiries WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

// ==============================================================================
// 8. Store Products & Orders Repository
// ==============================================================================
export class PostgresProductRepository implements IProductRepository {
  private get pool() {
    return PostgresConnection.getPool();
  }

  async list(options?: { category?: string; search?: string; inStockOnly?: boolean }): Promise<Product[]> {
    if (!this.pool) return [];
    const conditions: string[] = ['1=1'];
    const values: unknown[] = [];
    let idx = 1;

    if (options?.category && options.category !== 'all') {
      conditions.push(`LOWER(category) = LOWER($${idx++})`);
      values.push(options.category);
    }
    if (options?.inStockOnly) {
      conditions.push(`in_stock = TRUE`);
    }
    if (options?.search) {
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(description) LIKE $${idx})`);
      values.push(`%${options.search.toLowerCase()}%`);
      idx++;
    }

    const res = await this.pool.query(
      `SELECT id, title, category, price::float as price, original_price::float as "originalPrice",
              in_stock as "inStock", stock_quantity as "stockQuantity", sku, image, description,
              features, featured, specifications, created_at as "createdAt", updated_at as "updatedAt"
       FROM products
       WHERE ${conditions.join(' AND ')}
       ORDER BY featured DESC, created_at DESC`,
      values
    );
    return res.rows.map((p) => ({
      ...p,
      features: Array.isArray(p.features) ? p.features : [],
    }));
  }

  async findById(id: string): Promise<Product | null> {
    if (!this.pool) return null;
    const res = await this.pool.query(
      `SELECT id, title, category, price::float as price, original_price::float as "originalPrice",
              in_stock as "inStock", stock_quantity as "stockQuantity", sku, image, description,
              features, featured, specifications, created_at as "createdAt", updated_at as "updatedAt"
       FROM products WHERE id = $1`,
      [id]
    );
    if (!res.rows[0]) return null;
    const p = res.rows[0];
    return { ...p, features: Array.isArray(p.features) ? p.features : [] };
  }

  async create(product: Product): Promise<Product> {
    if (!this.pool) throw new Error('Database pool not connected');
    const id = product.id || `PROD-${Date.now()}`;
    const res = await this.pool.query(
      `INSERT INTO products (id, title, category, price, original_price, in_stock, stock_quantity, sku, image, description, features, featured, specifications)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, title, category, price::float as price, original_price::float as "originalPrice",
                 in_stock as "inStock", stock_quantity as "stockQuantity", sku, image, description,
                 features, featured, specifications, created_at as "createdAt", updated_at as "updatedAt"`,
      [
        id,
        product.title,
        product.category,
        product.price || 0,
        product.originalPrice || null,
        product.inStock !== false,
        product.stockQuantity || 0,
        product.sku || '',
        product.image || '',
        product.description || '',
        product.features || [],
        product.featured || false,
        JSON.stringify(product.specifications || {}),
      ]
    );
    return res.rows[0];
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!this.pool) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.title) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.category) { fields.push(`category = $${idx++}`); values.push(updates.category); }
    if (updates.price !== undefined) { fields.push(`price = $${idx++}`); values.push(updates.price); }
    if (updates.originalPrice !== undefined) { fields.push(`original_price = $${idx++}`); values.push(updates.originalPrice); }
    if (updates.inStock !== undefined) { fields.push(`in_stock = $${idx++}`); values.push(updates.inStock); }
    if (updates.stockQuantity !== undefined) { fields.push(`stock_quantity = $${idx++}`); values.push(updates.stockQuantity); }
    if (updates.sku !== undefined) { fields.push(`sku = $${idx++}`); values.push(updates.sku); }
    if (updates.image !== undefined) { fields.push(`image = $${idx++}`); values.push(updates.image); }
    if (updates.description !== undefined) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.features !== undefined) { fields.push(`features = $${idx++}`); values.push(updates.features); }
    if (updates.featured !== undefined) { fields.push(`featured = $${idx++}`); values.push(updates.featured); }
    if (updates.specifications !== undefined) { fields.push(`specifications = $${idx++}`); values.push(JSON.stringify(updates.specifications)); }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await this.pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, title, category, price::float as price, original_price::float as "originalPrice",
                 in_stock as "inStock", stock_quantity as "stockQuantity", sku, image, description,
                 features, featured, specifications, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.pool) return false;
    const res = await this.pool.query('DELETE FROM products WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async createOrder(order: StoreOrder): Promise<StoreOrder> {
    const id = order.id || `ORD-${Date.now()}`;
    const fullOrder: StoreOrder = { ...order, id, createdAt: new Date().toISOString() };
    if (!this.pool) return fullOrder;

    const res = await this.pool.query(
      `INSERT INTO store_orders (id, customer_name, email, phone, address, notes, items, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, customer_name as "customerName", email, phone, address, notes,
                 items, total_amount::float as "totalAmount", status, created_at as "createdAt"`,
      [
        id,
        order.customerName,
        order.email,
        order.phone,
        order.address,
        order.notes || null,
        JSON.stringify(order.items || []),
        order.totalAmount,
        order.status || 'PENDING',
      ]
    );
    return res.rows[0];
  }

  async listOrders(): Promise<StoreOrder[]> {
    if (!this.pool) return [];
    const res = await this.pool.query(
      `SELECT id, customer_name as "customerName", email, phone, address, notes,
              items, total_amount::float as "totalAmount", status, created_at as "createdAt"
       FROM store_orders ORDER BY created_at DESC`
    );
    return res.rows;
  }
}
