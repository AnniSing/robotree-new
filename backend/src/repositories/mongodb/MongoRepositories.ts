import { Db, ObjectId } from 'mongodb';
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
  SiteSettings,
} from '../../types/index.js';
import { MongoConnection } from '../../persistence/MongoConnection.js';

function getDb(): Db {
  const db = MongoConnection.getDb();
  if (!db) {
    throw new Error('MongoDB Atlas is not connected.');
  }
  return db;
}

function cleanDoc<T>(doc: any): T {
  if (!doc) return doc;
  const copy = { ...doc };
  if (copy._id && typeof copy._id === 'object' && copy.id) {
    delete copy._id;
  } else if (copy._id && !copy.id) {
    copy.id = String(copy._id);
    delete copy._id;
  }
  return copy as T;
}

// -------------------------------------------------------------
// History / Revision Tracker for Admin Changes
// -------------------------------------------------------------
export interface HistoryRecord {
  id: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  previousData?: any;
  newData?: any;
  updatedBy: string;
  timestamp: string;
}

export class MongoHistoryRepository {
  public static async record(
    entity: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    previousData: any,
    newData: any,
    updatedBy: string = 'admin@robotree.org'
  ): Promise<void> {
    try {
      const db = getDb();
      const col = db.collection('data_history');
      await col.insertOne({
        id: crypto.randomUUID(),
        entity,
        entityId: String(entityId),
        action,
        previousData: previousData ? JSON.parse(JSON.stringify(previousData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        updatedBy,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}
  }

  public static async list(limit = 50): Promise<HistoryRecord[]> {
    try {
      const db = getDb();
      const docs = await db.collection('data_history').find().sort({ timestamp: -1 }).limit(limit).toArray();
      return docs.map(cleanDoc<HistoryRecord>);
    } catch (_) {
      return [];
    }
  }

  public static async findById(id: string): Promise<HistoryRecord | null> {
    try {
      const db = getDb();
      const doc = await db.collection('data_history').findOne({ id });
      return doc ? cleanDoc<HistoryRecord>(doc) : null;
    } catch (_) {
      return null;
    }
  }
}

// -------------------------------------------------------------
// User Repository
// -------------------------------------------------------------
export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const col = getDb().collection('users');
    const doc = await col.findOne({ email: email.toLowerCase().trim() });
    return doc ? cleanDoc<User>(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const col = getDb().collection('users');
    const doc = await col.findOne({ $or: [{ id }, { _id: id as any }] } as any);
    return doc ? cleanDoc<User>(doc) : null;
  }

  async create(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const col = getDb().collection('users');
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id: user.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne({ ...newUser, _id: newUser.id as any });
    return newUser;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const col = getDb().collection('users');
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { $or: [{ id }, { _id: id as any }] } as any,
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    );
    return res ? cleanDoc<User>(res) : null;
  }

  async delete(id: string): Promise<boolean> {
    const col = getDb().collection('users');
    const res = await col.deleteOne({ $or: [{ id }, { _id: id as any }] } as any);
    return res.deletedCount > 0;
  }

  async list(): Promise<User[]> {
    const col = getDb().collection('users');
    const docs = await col.find().sort({ createdAt: -1 }).toArray();
    return docs.map(cleanDoc<User>);
  }

  async createSession(session: Session): Promise<Session> {
    const col = getDb().collection('sessions');
    await col.insertOne({ ...session, _id: session.id as any });
    return session;
  }

  async findSession(sessionId: string): Promise<Session | null> {
    const col = getDb().collection('sessions');
    const doc = await col.findOne({ id: sessionId });
    if (!doc) return null;
    if (new Date(doc.expiresAt).getTime() < Date.now()) {
      await col.deleteOne({ id: sessionId });
      return null;
    }
    return cleanDoc<Session>(doc);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const col = getDb().collection('sessions');
    const res = await col.deleteOne({ id: sessionId });
    return res.deletedCount > 0;
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const col = getDb().collection('sessions');
    await col.deleteMany({ userId });
  }
}

// -------------------------------------------------------------
// Certificate Repository
// -------------------------------------------------------------
export class MongoCertificateRepository implements ICertificateRepository {
  async findByCode(code: string): Promise<Certificate | null> {
    const col = getDb().collection('certificates');
    const cleanCode = code.trim().toUpperCase();
    const doc = await col.findOne({
      $or: [{ code: cleanCode }, { certificateId: cleanCode }, { id: cleanCode }],
    });
    return doc ? cleanDoc<Certificate>(doc) : null;
  }

  async findById(id: string): Promise<Certificate | null> {
    const col = getDb().collection('certificates');
    const cleanId = id.trim();
    const doc = await col.findOne({
      $or: [{ id: cleanId }, { certificateId: cleanId }, { code: cleanId }],
    });
    return doc ? cleanDoc<Certificate>(doc) : null;
  }

  async list(): Promise<Certificate[]> {
    const col = getDb().collection('certificates');
    const docs = await col.find().sort({ createdAt: -1 }).toArray();
    return docs.map(cleanDoc<Certificate>);
  }

  async create(certificate: Omit<Certificate, 'createdAt' | 'updatedAt'>): Promise<Certificate> {
    const col = getDb().collection('certificates');
    const now = new Date().toISOString();
    const newCert: Certificate = {
      ...certificate,
      id: certificate.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne({ ...newCert, _id: newCert.id as any });
    await MongoHistoryRepository.record('certificates', newCert.id, 'CREATE', null, newCert);
    return newCert;
  }

  async update(id: string, updates: Partial<Certificate>): Promise<Certificate | null> {
    const col = getDb().collection('certificates');
    const prev = await this.findById(id);
    if (!prev) return null;
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { $or: [{ id }, { certificateId: id }] },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (res) {
      const updated = cleanDoc<Certificate>(res);
      await MongoHistoryRepository.record('certificates', id, 'UPDATE', prev, updated);
      return updated;
    }
    return null;
  }

  async revoke(id: string, reason = 'Revoked by administrator'): Promise<Certificate | null> {
    return this.update(id, {
      status: 'REVOKED',
      revokedAt: new Date().toISOString(),
      revokedReason: reason,
    });
  }

  async reinstate(id: string): Promise<Certificate | null> {
    return this.update(id, {
      status: 'ISSUED',
      revokedAt: undefined,
      revokedReason: undefined,
    });
  }

  async delete(id: string): Promise<boolean> {
    const col = getDb().collection('certificates');
    const prev = await this.findById(id);
    const res = await col.deleteOne({ $or: [{ id }, { certificateId: id }] });
    if (res.deletedCount > 0 && prev) {
      await MongoHistoryRepository.record('certificates', id, 'DELETE', prev, null);
      return true;
    }
    return res.deletedCount > 0;
  }
}

// -------------------------------------------------------------
// Course Repository
// -------------------------------------------------------------
export class MongoCourseRepository implements ICourseRepository {
  async list(): Promise<Course[]> {
    const col = getDb().collection('courses');
    const docs = await col.find().sort({ order: 1, createdAt: -1 }).toArray();
    return docs.map(cleanDoc<Course>);
  }

  async findById(id: string): Promise<Course | null> {
    const col = getDb().collection('courses');
    const doc = await col.findOne({ id });
    return doc ? cleanDoc<Course>(doc) : null;
  }

  async create(course: Course): Promise<Course> {
    const col = getDb().collection('courses');
    const now = new Date().toISOString();
    const newCourse: Course = {
      ...course,
      id: course.id || `course-${Date.now()}`,
    };
    await col.insertOne({ ...newCourse, _id: newCourse.id as any });
    await MongoHistoryRepository.record('courses', newCourse.id, 'CREATE', null, newCourse);
    return newCourse;
  }

  async update(id: string, updates: Partial<Course>): Promise<Course | null> {
    const col = getDb().collection('courses');
    const prev = await this.findById(id);
    if (!prev) return null;
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (res) {
      const updated = cleanDoc<Course>(res);
      await MongoHistoryRepository.record('courses', id, 'UPDATE', prev, updated);
      return updated;
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    const col = getDb().collection('courses');
    const prev = await this.findById(id);
    const res = await col.deleteOne({ id });
    if (res.deletedCount > 0 && prev) {
      await MongoHistoryRepository.record('courses', id, 'DELETE', prev, null);
      return true;
    }
    return res.deletedCount > 0;
  }
}

// -------------------------------------------------------------
// Team Repository
// -------------------------------------------------------------
export class MongoTeamRepository implements ITeamRepository {
  async list(): Promise<TeamMember[]> {
    const col = getDb().collection('team');
    const docs = await col.find().sort({ id: 1 }).toArray();
    return docs.map(cleanDoc<TeamMember>);
  }

  async findById(id: number | string): Promise<TeamMember | null> {
    const col = getDb().collection('team');
    const numId = Number(id);
    const doc = await col.findOne({
      $or: [{ id: numId || id }, { id: String(id) }, { _id: String(id) as any }],
    } as any);
    return doc ? cleanDoc<TeamMember>(doc) : null;
  }

  async create(member: TeamMember): Promise<TeamMember> {
    const col = getDb().collection('team');
    const docs = await col.find().sort({ id: -1 }).limit(1).toArray();
    const maxId = docs.length > 0 ? Number(docs[0].id) || 0 : 0;
    const newMember: TeamMember = {
      ...member,
      id: member.id || maxId + 1,
    };
    await col.insertOne({ ...newMember, _id: String(newMember.id) as any });
    await MongoHistoryRepository.record('team', String(newMember.id), 'CREATE', null, newMember);
    return newMember;
  }

  async update(id: number | string, updates: Partial<TeamMember>): Promise<TeamMember | null> {
    const col = getDb().collection('team');
    const prev = await this.findById(id);
    if (!prev) return null;
    const numId = Number(id);
    const res = await col.findOneAndUpdate(
      { $or: [{ id: numId || id }, { id: String(id) }, { _id: String(id) as any }] } as any,
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (res) {
      const updated = cleanDoc<TeamMember>(res);
      await MongoHistoryRepository.record('team', String(id), 'UPDATE', prev, updated);
      return updated;
    }
    return null;
  }

  async delete(id: number | string): Promise<boolean> {
    const col = getDb().collection('team');
    const prev = await this.findById(id);
    const numId = Number(id);
    const res = await col.deleteOne({
      $or: [{ id: numId || id }, { id: String(id) }, { _id: String(id) as any }],
    } as any);
    if (res.deletedCount > 0 && prev) {
      await MongoHistoryRepository.record('team', String(id), 'DELETE', prev, null);
      return true;
    }
    return res.deletedCount > 0;
  }
}

// -------------------------------------------------------------
// Event Gallery Repository
// -------------------------------------------------------------
export class MongoEventRepository implements IEventRepository {
  async list(): Promise<EventGalleryItem[]> {
    const col = getDb().collection('events_gallery');
    const docs = await col.find().sort({ date: -1, createdAt: -1 }).toArray();
    return docs.map(cleanDoc<EventGalleryItem>);
  }

  async findById(id: string): Promise<EventGalleryItem | null> {
    const col = getDb().collection('events_gallery');
    const doc = await col.findOne({ id });
    return doc ? cleanDoc<EventGalleryItem>(doc) : null;
  }

  async create(event: EventGalleryItem): Promise<EventGalleryItem> {
    const col = getDb().collection('events_gallery');
    const newEvent: EventGalleryItem = {
      ...event,
      id: event.id || `evt-${Date.now()}`,
    };
    await col.insertOne({ ...newEvent, _id: newEvent.id as any });
    await MongoHistoryRepository.record('events_gallery', newEvent.id, 'CREATE', null, newEvent);
    return newEvent;
  }

  async update(id: string, updates: Partial<EventGalleryItem>): Promise<EventGalleryItem | null> {
    const col = getDb().collection('events_gallery');
    const prev = await this.findById(id);
    if (!prev) return null;
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    if (res) {
      const updated = cleanDoc<EventGalleryItem>(res);
      await MongoHistoryRepository.record('events_gallery', id, 'UPDATE', prev, updated);
      return updated;
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    const col = getDb().collection('events_gallery');
    const prev = await this.findById(id);
    const res = await col.deleteOne({ id });
    if (res.deletedCount > 0 && prev) {
      await MongoHistoryRepository.record('events_gallery', id, 'DELETE', prev, null);
      return true;
    }
    return res.deletedCount > 0;
  }

  async deletePhoto(eventId: string, photoUrl: string): Promise<EventGalleryItem | null> {
    const event = await this.findById(eventId);
    if (!event) return null;
    const images = (event.images || []).filter((p: string) => p !== photoUrl);
    const image = event.image === photoUrl ? (images.length > 0 ? images[0] : '') : event.image;
    return this.update(eventId, { images, image });
  }
}

// -------------------------------------------------------------
// Product Repository
// -------------------------------------------------------------
export class MongoProductRepository implements IProductRepository {
  async list(options?: { category?: string; search?: string; inStockOnly?: boolean }): Promise<Product[]> {
    const col = getDb().collection('products');
    const query: any = {};

    if (options?.category && options.category.toLowerCase() !== 'all') {
      const cat = options.category.trim();
      query.category = { $regex: new RegExp(`^${cat}$`, 'i') };
    }
    if (options?.search) {
      const q = options.search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
      ];
    }
    if (options?.inStockOnly) {
      query.inStock = true;
      query.stockQuantity = { $gt: 0 };
    }

    const docs = await col.find(query).sort({ createdAt: -1 }).toArray();
    return docs.map(cleanDoc<Product>);
  }

  async findById(id: string): Promise<Product | null> {
    const col = getDb().collection('products');
    const cleanId = id.trim();
    const doc = await col.findOne({
      $or: [{ id: cleanId }, { sku: cleanId }, { id: cleanId.toLowerCase() }],
    });
    return doc ? cleanDoc<Product>(doc) : null;
  }

  async create(product: Product): Promise<Product> {
    const col = getDb().collection('products');
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: product.id || `PROD-RBT-${Date.now().toString().slice(-6)}`,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne({ ...newProduct, _id: newProduct.id as any });
    await MongoHistoryRepository.record('products', newProduct.id, 'CREATE', null, newProduct);
    return newProduct;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    const col = getDb().collection('products');
    const prev = await this.findById(id);
    if (!prev) return null;
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { $or: [{ id }, { sku: id }] },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (res) {
      const updated = cleanDoc<Product>(res);
      await MongoHistoryRepository.record('products', id, 'UPDATE', prev, updated);
      return updated;
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    const col = getDb().collection('products');
    const prev = await this.findById(id);
    const res = await col.deleteOne({ $or: [{ id }, { sku: id }] });
    if (res.deletedCount > 0 && prev) {
      await MongoHistoryRepository.record('products', id, 'DELETE', prev, null);
      return true;
    }
    return res.deletedCount > 0;
  }

  async createOrder(order: StoreOrder): Promise<StoreOrder> {
    const col = getDb().collection('orders');
    const now = new Date().toISOString();
    const newOrder: StoreOrder = {
      ...order,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne({ ...newOrder, _id: newOrder.id as any });
    return newOrder;
  }

  async listOrders(): Promise<StoreOrder[]> {
    const col = getDb().collection('orders');
    const docs = await col.find().sort({ createdAt: -1 }).toArray();
    return docs.map(cleanDoc<StoreOrder>);
  }
}

// -------------------------------------------------------------
// Inquiry Repository
// -------------------------------------------------------------
export class MongoInquiryRepository implements IInquiryRepository {
  async create(inquiry: Omit<Inquiry, 'createdAt'>): Promise<Inquiry> {
    const col = getDb().collection('inquiries');
    const now = new Date().toISOString();
    const newInquiry: Inquiry = {
      ...inquiry,
      id: inquiry.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne({ ...newInquiry, _id: newInquiry.id as any });
    return newInquiry;
  }

  async list(): Promise<Inquiry[]> {
    const col = getDb().collection('inquiries');
    const docs = await col.find().sort({ createdAt: -1 }).toArray();
    return docs.map(cleanDoc<Inquiry>);
  }

  async findById(id: string): Promise<Inquiry | null> {
    const col = getDb().collection('inquiries');
    const doc = await col.findOne({ id });
    return doc ? cleanDoc<Inquiry>(doc) : null;
  }

  async update(id: string, updates: Partial<Inquiry>): Promise<Inquiry | null> {
    const col = getDb().collection('inquiries');
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    );
    return res ? cleanDoc<Inquiry>(res) : null;
  }

  async delete(id: string): Promise<boolean> {
    const col = getDb().collection('inquiries');
    const res = await col.deleteOne({ id });
    return res.deletedCount > 0;
  }
}

// -------------------------------------------------------------
// Audit Repository
// -------------------------------------------------------------
export class MongoAuditRepository implements IAuditRepository {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const col = getDb().collection('audit_logs');
    const log: AuditLog = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    await col.insertOne({ ...log, _id: log.id as any });
    return log;
  }

  async list(limit = 100): Promise<AuditLog[]> {
    const col = getDb().collection('audit_logs');
    const docs = await col.find().sort({ timestamp: -1 }).limit(limit).toArray();
    return docs.map(cleanDoc<AuditLog>);
  }
}

// -------------------------------------------------------------
// Showcase Photos Repository
// -------------------------------------------------------------
export interface ShowcaseItem {
  id: string;
  title: string;
  caption?: string;
  category?: string;
  image: string;
  format?: string;
  featured?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export class MongoShowcaseRepository {
  static async list(): Promise<ShowcaseItem[]> {
    const col = getDb().collection('showcase_gallery');
    const docs = await col.find().sort({ order: 1, createdAt: -1 }).toArray();
    return docs.map(cleanDoc<ShowcaseItem>);
  }

  static async findById(id: string): Promise<ShowcaseItem | null> {
    const col = getDb().collection('showcase_gallery');
    const doc = await col.findOne({ id });
    return doc ? cleanDoc<ShowcaseItem>(doc) : null;
  }

  static async create(item: ShowcaseItem): Promise<ShowcaseItem> {
    const col = getDb().collection('showcase_gallery');
    const now = new Date().toISOString();
    const newItem: ShowcaseItem = {
      ...item,
      id: item.id || `showcase-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne({ ...newItem, _id: newItem.id as any });
    await MongoHistoryRepository.record('showcase_gallery', newItem.id, 'CREATE', null, newItem);
    return newItem;
  }

  static async update(id: string, updates: Partial<ShowcaseItem>): Promise<ShowcaseItem | null> {
    const col = getDb().collection('showcase_gallery');
    const prev = await this.findById(id);
    if (!prev) return null;
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (res) {
      const updated = cleanDoc<ShowcaseItem>(res);
      await MongoHistoryRepository.record('showcase_gallery', id, 'UPDATE', prev, updated);
      return updated;
    }
    return null;
  }

  static async delete(id: string): Promise<boolean> {
    const col = getDb().collection('showcase_gallery');
    const prev = await this.findById(id);
    const res = await col.deleteOne({ id });
    if (res.deletedCount > 0 && prev) {
      await MongoHistoryRepository.record('showcase_gallery', id, 'DELETE', prev, null);
      return true;
    }
    return res.deletedCount > 0;
  }
}

// -------------------------------------------------------------
// Partner Institutes Repository
// -------------------------------------------------------------
export interface InstituteItem {
  id: string;
  name: string;
  location?: string;
  category?: string;
  description?: string;
  logo?: string;
  tags?: string[] | string;
  tier?: string;
  verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class MongoInstituteRepository {
  static async list(): Promise<InstituteItem[]> {
    const col = getDb().collection('institutes');
    const docs = await col.find().sort({ name: 1 }).toArray();
    return docs.map(cleanDoc<InstituteItem>);
  }

  static async findById(id: string): Promise<InstituteItem | null> {
    const col = getDb().collection('institutes');
    const doc = await col.findOne({ id });
    return doc ? cleanDoc<InstituteItem>(doc) : null;
  }

  static async create(item: InstituteItem): Promise<InstituteItem> {
    const col = getDb().collection('institutes');
    const now = new Date().toISOString();
    const newItem: InstituteItem = {
      ...item,
      id: item.id || `inst-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    await col.insertOne({ ...newItem, _id: newItem.id as any });
    await MongoHistoryRepository.record('institutes', newItem.id, 'CREATE', null, newItem);
    return newItem;
  }

  static async update(id: string, updates: Partial<InstituteItem>): Promise<InstituteItem | null> {
    const col = getDb().collection('institutes');
    const prev = await this.findById(id);
    if (!prev) return null;
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (res) {
      const updated = cleanDoc<InstituteItem>(res);
      await MongoHistoryRepository.record('institutes', id, 'UPDATE', prev, updated);
      return updated;
    }
    return null;
  }

  static async delete(id: string): Promise<boolean> {
    const col = getDb().collection('institutes');
    const prev = await this.findById(id);
    const res = await col.deleteOne({ id });
    if (res.deletedCount > 0 && prev) {
      await MongoHistoryRepository.record('institutes', id, 'DELETE', prev, null);
      return true;
    }
    return res.deletedCount > 0;
  }
}

// -------------------------------------------------------------
// Site Settings Repository
// -------------------------------------------------------------
export class MongoSettingsRepository {
  static async get(): Promise<SiteSettings> {
    try {
      const col = getDb().collection('settings');
      const doc = await col.findOne({ _id: 'site_settings' as any });
      if (doc) {
        return cleanDoc<SiteSettings>(doc);
      }
    } catch (_) {}
    return {
      heroStatNumber: '20,000+',
      heroStatLabel: 'Students Trained',
      governmentProtocol: 'Robotree Robotics LLP • Operating in accordance with Government of India Protocols (GeM & MSME Accredited Entity)',
      adminPasswordPermissionLocked: false,
    };
  }

  static async update(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const col = getDb().collection('settings');
    const prev = await this.get();
    const now = new Date().toISOString();
    const res = await col.findOneAndUpdate(
      { _id: 'site_settings' as any },
      { $set: { ...updates, updatedAt: now } },
      { upsert: true, returnDocument: 'after' }
    );
    const updated = res ? cleanDoc<SiteSettings>(res) : { ...prev, ...updates };
    await MongoHistoryRepository.record('settings', 'site_settings', 'UPDATE', prev, updated);
    return updated;
  }
}
