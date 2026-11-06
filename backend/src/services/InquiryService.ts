import crypto from 'node:crypto';
import { repositories } from '../repositories/index.js';
import { db } from '../persistence/json-database.js';
import { sanitizeValue } from '../security/hasher.js';
import { NotFoundError } from '../errors/AppError.js';
import { Inquiry } from '../models/index.js';

export interface SubmitContactDto {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message: string;
}

export interface RecordProgramInterestDto {
  name?: string;
  email?: string;
  phone?: string;
  program: string;
}

export interface SubmitFeedbackDto {
  name?: string;
  rating?: number | string;
  comments?: string;
  message?: string;
}

export interface RecordAnalyticsDto {
  event: string;
  path?: string;
  timestamp?: string;
}

export class InquiryService {
  public static async submitContact(dto: SubmitContactDto): Promise<{ inquiryId: string }> {
    const sanitizedName = sanitizeValue(dto.name, 100);
    const sanitizedInterest = sanitizeValue(dto.interest || '', 100);
    const sanitizedMessage = sanitizeValue(dto.message, 2000);

    const inquiry = await repositories.inquiries.create({
      id: 'INQ_' + crypto.randomBytes(6).toString('hex'),
      name: sanitizedName,
      email: dto.email,
      phone: dto.phone,
      interest: sanitizedInterest,
      message: sanitizedMessage,
      status: 'NEW',
    });

    return { inquiryId: inquiry.id };
  }

  public static async subscribeNewsletter(email: string): Promise<boolean> {
    const newsletters = db.getNewsletters();
    if (!newsletters.some((n: any) => n.email === email)) {
      newsletters.unshift({
        email,
        subscribedAt: new Date().toISOString(),
      });
      db.saveNewsletters(newsletters);
      return true;
    }
    return false;
  }

  public static async recordProgramInterest(dto: RecordProgramInterestDto): Promise<void> {
    const interests = db.getProgramInterests();
    interests.unshift({
      id: 'INT_' + Date.now(),
      name: dto.name || 'Interested Visitor',
      email: dto.email || '',
      phone: dto.phone || '',
      program: dto.program,
      createdAt: new Date().toISOString(),
    });
    db.saveProgramInterests(interests);
  }

  public static async submitFeedback(dto: SubmitFeedbackDto): Promise<void> {
    const feedbackText = (dto.comments || dto.message || '').trim();
    const feedbackList = db.getFeedback();
    feedbackList.unshift({
      id: 'FB_' + Date.now(),
      name: dto.name || 'Anonymous',
      rating: Number(dto.rating) || 5,
      comments: feedbackText,
      createdAt: new Date().toISOString(),
    });
    db.saveFeedback(feedbackList);
  }

  public static async recordAnalytics(dto: RecordAnalyticsDto, ip?: string): Promise<void> {
    const analytics = db.getAnalytics();
    analytics.unshift({
      event: dto.event,
      path: dto.path,
      timestamp: dto.timestamp || new Date().toISOString(),
      ip,
    });
    if (analytics.length > 5000) analytics.length = 5000;
    db.saveAnalytics(analytics);
  }

  public static async listInquiries(): Promise<Inquiry[]> {
    return repositories.inquiries.list();
  }

  public static async updateInquiry(id: string, updates: Partial<Inquiry>): Promise<Inquiry> {
    const existing = await repositories.inquiries.findById(id);
    if (!existing) {
      throw new NotFoundError(`Inquiry lead with ID ${id} not found.`);
    }
    const updated = await repositories.inquiries.update(id, updates);
    if (!updated) {
      throw new NotFoundError(`Inquiry lead with ID ${id} not found.`);
    }
    return updated;
  }

  public static async deleteInquiry(id: string): Promise<void> {
    const existing = await repositories.inquiries.findById(id);
    if (!existing) {
      throw new NotFoundError(`Inquiry lead with ID ${id} not found.`);
    }
    await repositories.inquiries.delete(id);

    // Also remove associated order from orders database if this inquiry is linked to an order
    const orderId = (existing as any).orderId || (existing.id.startsWith('INQ-ORD-') ? existing.id.replace(/^INQ-/, '') : null);
    if (orderId && typeof (db as any).getOrders === 'function') {
      const orders = (db as any).getOrders();
      const filtered = orders.filter((o: any) => o.id !== orderId && o.id !== `ORD-${orderId}`);
      if (filtered.length !== orders.length) {
        (db as any).saveOrders(filtered);
      }
    }
  }
}
