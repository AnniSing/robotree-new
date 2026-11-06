import { IUserRepository } from '../interfaces/IUserRepository.js';
import { ICertificateRepository } from '../interfaces/ICertificateRepository.js';
import { ICourseRepository } from '../interfaces/ICourseRepository.js';
import { ITeamRepository } from '../interfaces/ITeamRepository.js';
import { IEventRepository } from '../interfaces/IEventRepository.js';
import { IAuditRepository } from '../interfaces/IAuditRepository.js';
import { IInquiryRepository, Inquiry } from '../interfaces/IInquiryRepository.js';
import { IProductRepository } from '../interfaces/IProductRepository.js';
import { User, Session, Certificate, Course, TeamMember, EventGalleryItem, AuditLog, Product, StoreOrder } from '../../types/index.js';
import { db } from '../../persistence/json-database.js';
import crypto from 'node:crypto';

// In-memory active sessions store
const activeSessions = new Map<string, Session>();

export class JsonUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const users = db.getUsers();
    const user = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase().trim());
    return user || null;
  }

  async findById(id: string): Promise<User | null> {
    const users = db.getUsers();
    const user = users.find((u: User) => u.id === id);
    return user || null;
  }

  async create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = db.getUsers();
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };
    users.push(newUser);
    db.saveUsers(users);
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const users = db.getUsers();
    const index = users.findIndex((u: User) => u.id === id);
    if (index === -1) return null;
    const now = new Date().toISOString();
    const updatedUser: User = {
      ...users[index],
      ...updates,
      updatedAt: now,
    };
    users[index] = updatedUser;
    db.saveUsers(users);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const users = db.getUsers();
    const initialLen = users.length;
    const filtered = users.filter((u: User) => u.id !== id);
    if (filtered.length === initialLen) return false;
    db.saveUsers(filtered);
    return true;
  }

  async list(): Promise<User[]> {
    return db.getUsers();
  }

  async createSession(session: Session): Promise<Session> {
    activeSessions.set(session.id, session);
    return session;
  }

  async findSession(sessionId: string): Promise<Session | null> {
    const session = activeSessions.get(sessionId);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      activeSessions.delete(sessionId);
      return null;
    }
    session.lastActive = new Date().toISOString();
    return session;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return activeSessions.delete(sessionId);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    for (const [sId, session] of activeSessions.entries()) {
      if (session.userId === userId) {
        activeSessions.delete(sId);
      }
    }
  }
}

export class JsonCertificateRepository implements ICertificateRepository {
  async findByCode(code: string): Promise<Certificate | null> {
    const certs = db.getCertificates();
    const cleanCode = code.trim().toLowerCase();
    const found = certs.find(
      (c: Certificate) =>
        (c.code && c.code.toLowerCase() === cleanCode) ||
        (c.id && c.id.toLowerCase() === cleanCode) ||
        (c.certificateNumber && c.certificateNumber.toLowerCase() === cleanCode) ||
        ((c as any).enrollmentNo && String((c as any).enrollmentNo).toLowerCase() === cleanCode) ||
        ((c as any).enrollmentNumber && String((c as any).enrollmentNumber).toLowerCase() === cleanCode) ||
        (c.studentEmail && c.studentEmail.toLowerCase() === cleanCode) ||
        (c.studentName && c.studentName.toLowerCase() === cleanCode)
    );
    return found || null;
  }

  async findById(id: string): Promise<Certificate | null> {
    return this.findByCode(id);
  }

  async list(): Promise<Certificate[]> {
    return db.getCertificates();
  }

  async create(cert: Omit<Certificate, 'createdAt' | 'updatedAt'>): Promise<Certificate> {
    const certs = db.getCertificates();
    const now = new Date().toISOString();
    const newCert: Certificate = {
      ...cert,
      createdAt: now,
      updatedAt: now,
    };
    certs.push(newCert);
    db.saveCertificates(certs);
    return newCert;
  }

  async update(id: string, updates: Partial<Certificate>): Promise<Certificate | null> {
    const certs = db.getCertificates();
    const cleanId = id.trim().toLowerCase();
    const index = certs.findIndex(
      (c: Certificate) =>
        (c.id && c.id.toLowerCase() === cleanId) ||
        (c.code && c.code.toLowerCase() === cleanId) ||
        (c.certificateNumber && c.certificateNumber.toLowerCase() === cleanId)
    );
    if (index === -1) return null;
    const now = new Date().toISOString();
    const updated: Certificate = {
      ...certs[index],
      ...updates,
      updatedAt: now,
    };
    certs[index] = updated;
    db.saveCertificates(certs);
    return updated;
  }

  async revoke(id: string, reason = 'Administrative revocation'): Promise<Certificate | null> {
    return this.update(id, {
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    });
  }

  async reinstate(id: string): Promise<Certificate | null> {
    const certs = db.getCertificates();
    const cleanId = id.trim().toLowerCase();
    const index = certs.findIndex(
      (c: Certificate) =>
        (c.id && c.id.toLowerCase() === cleanId) ||
        (c.code && c.code.toLowerCase() === cleanId) ||
        (c.certificateNumber && c.certificateNumber.toLowerCase() === cleanId)
    );
    if (index === -1) return null;
    const cert = { ...certs[index] };
    delete cert.revokedAt;
    delete cert.revokedReason;
    cert.status = 'ISSUED';
    cert.updatedAt = new Date().toISOString();
    certs[index] = cert;
    db.saveCertificates(certs);
    return cert;
  }

  async delete(id: string): Promise<boolean> {
    const certs = db.getCertificates();
    const cleanId = id.trim().toLowerCase();
    const initialLen = certs.length;
    const filtered = certs.filter(
      (c: Certificate) =>
        c.id?.toLowerCase() !== cleanId &&
        c.code?.toLowerCase() !== cleanId &&
        c.certificateNumber?.toLowerCase() !== cleanId
    );
    if (filtered.length === initialLen) return false;
    db.saveCertificates(filtered);
    return true;
  }
}

export class JsonCourseRepository implements ICourseRepository {
  async list(): Promise<Course[]> {
    return db.getCourses();
  }

  async findById(id: string): Promise<Course | null> {
    const courses = db.getCourses();
    const cleanId = id.trim().toLowerCase();
    const course = courses.find((c: Course) => c.id.toLowerCase() === cleanId);
    return course || null;
  }

  async create(course: Course): Promise<Course> {
    const courses = db.getCourses();
    courses.push(course);
    db.saveCourses(courses);
    return course;
  }

  async update(id: string, updates: Partial<Course>): Promise<Course | null> {
    const courses = db.getCourses();
    const cleanId = id.trim().toLowerCase();
    const index = courses.findIndex((c: Course) => c.id.toLowerCase() === cleanId);
    if (index === -1) return null;
    const updated: Course = { ...courses[index], ...updates };
    courses[index] = updated;
    db.saveCourses(courses);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const courses = db.getCourses();
    const cleanId = id.trim().toLowerCase();
    const initialLen = courses.length;
    const filtered = courses.filter((c: Course) => c.id.toLowerCase() !== cleanId);
    if (filtered.length === initialLen) return false;
    db.saveCourses(filtered);
    return true;
  }
}

export class JsonTeamRepository implements ITeamRepository {
  async list(): Promise<TeamMember[]> {
    return db.getTeam();
  }

  async findById(id: number | string): Promise<TeamMember | null> {
    const team = db.getTeam();
    const member = team.find((m: TeamMember) => String(m.id) === String(id));
    return member || null;
  }

  async create(member: TeamMember): Promise<TeamMember> {
    const team = db.getTeam();
    if (!member.id) {
      const nextId = team.length > 0 ? Math.max(...team.map((m: TeamMember) => Number(m.id) || 0)) + 1 : 1;
      member.id = nextId;
    }
    team.push(member);
    db.saveTeam(team);
    return member;
  }

  async update(id: number | string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
    const team = db.getTeam();
    const index = team.findIndex((m: TeamMember) => String(m.id) === String(id));
    if (index === -1) return null;
    const updated = { ...team[index], ...updates };
    team[index] = updated;
    db.saveTeam(team);
    return updated;
  }

  async delete(id: number | string): Promise<boolean> {
    const team = db.getTeam();
    const initialLen = team.length;
    const filtered = team.filter((m: TeamMember) => String(m.id) !== String(id));
    if (filtered.length === initialLen) return false;
    db.saveTeam(filtered);
    return true;
  }
}

export class JsonEventRepository implements IEventRepository {
  async list(): Promise<EventGalleryItem[]> {
    return db.getEvents();
  }

  async findById(id: string): Promise<EventGalleryItem | null> {
    const events = db.getEvents();
    const cleanId = id.trim().toLowerCase();
    const found = events.find((e: EventGalleryItem) => e.id.toLowerCase() === cleanId);
    return found || null;
  }

  async create(event: EventGalleryItem): Promise<EventGalleryItem> {
    const events = db.getEvents();
    events.unshift(event);
    db.saveEvents(events);
    return event;
  }

  async update(id: string, updates: Partial<EventGalleryItem>): Promise<EventGalleryItem | null> {
    const events = db.getEvents();
    const cleanId = id.trim().toLowerCase();
    const index = events.findIndex((e: EventGalleryItem) => e.id.toLowerCase() === cleanId);
    if (index === -1) return null;
    const updated = { ...events[index], ...updates };
    events[index] = updated;
    db.saveEvents(events);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const events = db.getEvents();
    const cleanId = id.trim().toLowerCase();
    const initialLen = events.length;
    const filtered = events.filter((e: EventGalleryItem) => e.id.toLowerCase() !== cleanId);
    if (filtered.length === initialLen) return false;
    db.saveEvents(filtered);
    return true;
  }

  async deletePhoto(eventId: string, photoUrl: string): Promise<EventGalleryItem | null> {
    const events = db.getEvents();
    const cleanId = eventId.trim().toLowerCase();
    const event = events.find((e: EventGalleryItem) => e.id.toLowerCase() === cleanId);
    if (!event) return null;

    if (Array.isArray(event.images)) {
      event.images = event.images.filter((img: string) => img !== photoUrl);
    }
    if (event.image === photoUrl) {
      event.image = event.images && event.images.length > 0 ? event.images[0] : '';
    }
    db.saveEvents(events);
    return event;
  }
}

export class JsonAuditRepository implements IAuditRepository {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const activities = db.getActivities();
    const newLog: AuditLog = {
      id: 'log_' + crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    activities.unshift(newLog);
    if (activities.length > 2000) {
      activities.length = 2000;
    }
    db.saveActivities(activities);
    return newLog;
  }

  async list(limit = 100): Promise<AuditLog[]> {
    const activities = db.getActivities();
    return activities.slice(0, limit);
  }
}

export class JsonInquiryRepository implements IInquiryRepository {
  async create(inquiry: Omit<Inquiry, 'createdAt'>): Promise<Inquiry> {
    const inquiries = db.getInquiries();
    const newInquiry: Inquiry = {
      ...inquiry,
      createdAt: new Date().toISOString(),
    };
    inquiries.unshift(newInquiry);
    db.saveInquiries(inquiries);
    return newInquiry;
  }

  async list(): Promise<Inquiry[]> {
    return db.getInquiries();
  }

  async findById(id: string): Promise<Inquiry | null> {
    const inquiries = db.getInquiries();
    return inquiries.find((i: Inquiry) => i.id === id) || null;
  }

  async update(id: string, updates: Partial<Inquiry>): Promise<Inquiry | null> {
    const inquiries = db.getInquiries();
    const index = inquiries.findIndex((i: Inquiry) => i.id === id);
    if (index === -1) return null;
    const updated = { ...inquiries[index], ...updates, updatedAt: new Date().toISOString() };
    inquiries[index] = updated;
    db.saveInquiries(inquiries);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const inquiries = db.getInquiries();
    const initialLen = inquiries.length;
    const filtered = inquiries.filter((i: Inquiry) => i.id !== id);
    if (filtered.length === initialLen) return false;
    db.saveInquiries(filtered);
    return true;
  }
}

export class JsonProductRepository implements IProductRepository {
  async list(options?: { category?: string; search?: string; inStockOnly?: boolean }): Promise<Product[]> {
    let products = db.getProducts();
    if (options?.category && options.category.toLowerCase() !== 'all') {
      const targetCat = options.category.toLowerCase().trim();
      const catSlug = targetCat.replace(/[^a-z0-9]/g, '');
      products = products.filter((p: Product) => {
        const pSlug = p.category.toLowerCase().replace(/[^a-z0-9]/g, '');
        return pSlug === catSlug || p.category.toLowerCase() === targetCat;
      });
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      products = products.filter((p: Product) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    if (options?.inStockOnly) {
      products = products.filter((p: Product) => p.inStock && p.stockQuantity > 0);
    }
    return products;
  }

  async findById(id: string): Promise<Product | null> {
    const products = db.getProducts();
    const cleanId = id.trim().toLowerCase();
    const product = products.find((p: Product) => p.id.toLowerCase() === cleanId || p.sku.toLowerCase() === cleanId);
    return product || null;
  }

  async create(product: Product): Promise<Product> {
    const products = db.getProducts();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      createdAt: now,
      updatedAt: now,
    };
    products.unshift(newProduct);
    db.saveProducts(products);
    return newProduct;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const products = db.getProducts();
    const cleanId = id.trim().toLowerCase();
    const index = products.findIndex((p: Product) => p.id.toLowerCase() === cleanId || p.sku.toLowerCase() === cleanId);
    if (index === -1) return null;
    const now = new Date().toISOString();
    const updated: Product = {
      ...products[index],
      ...updates,
      updatedAt: now,
    };
    products[index] = updated;
    db.saveProducts(products);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const products = db.getProducts();
    const cleanId = id.trim().toLowerCase();
    const initialLen = products.length;
    const filtered = products.filter((p: Product) => p.id.toLowerCase() !== cleanId && p.sku.toLowerCase() !== cleanId);
    if (filtered.length === initialLen) return false;
    db.saveProducts(filtered);
    return true;
  }

  async createOrder(order: StoreOrder): Promise<StoreOrder> {
    const orders = db.getOrders();
    orders.unshift(order);
    db.saveOrders(orders);
    return order;
  }

  async listOrders(): Promise<StoreOrder[]> {
    return db.getOrders();
  }
}

