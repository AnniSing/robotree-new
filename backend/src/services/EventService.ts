import { repositories } from '../repositories/index.js';
import { EventGalleryItem, ShowcaseItem } from '../types/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { AuditService } from './AuditService.js';
import { SyncService } from './SyncService.js';
import { db } from '../persistence/json-database.js';
import crypto from 'node:crypto';

export class EventService {
  public static async listEvents(): Promise<EventGalleryItem[]> {
    return repositories.events.list();
  }

  public static async getEvent(id: string): Promise<EventGalleryItem> {
    const event = await repositories.events.findById(id);
    if (!event) throw new NotFoundError(`Event not found: ${id}`);
    return event;
  }

  public static async createEvent(data: Partial<EventGalleryItem>, actor = 'System Administrator', ip = '127.0.0.1'): Promise<EventGalleryItem> {
    const eventId = data.id || `EVT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const images = Array.isArray(data.images) && data.images.length > 0 ? data.images : (data.image ? [data.image] : []);
    const coverImage = data.image || (images.length > 0 ? images[0] : '');

    const newEvent: EventGalleryItem = {
      id: eventId,
      title: data.title || 'Untitled Event',
      category: data.category || 'School Robotics',
      institution: data.institution || 'Robotree Academy',
      date: data.date || new Date().toISOString().split('T')[0],
      description: data.description || '',
      image: coverImage,
      images,
      tags: data.tags || [],
    };

    const created = await repositories.events.create(newEvent);
    SyncService.broadcast('events', 'CREATE', newEvent.id);
    await repositories.history.record('events', newEvent.id, 'CREATE', null, created, actor, ip);
    await AuditService.logAction(actor, 'EVENT_CREATED', 'events', `Created event: ${newEvent.title} from IP ${ip}`, {
      resourceId: newEvent.id,
      ip,
    });
    return created;
  }

  public static async updateEvent(id: string, updates: Partial<EventGalleryItem>, actor = 'System Administrator', ip = '127.0.0.1'): Promise<EventGalleryItem> {
    if (updates.images && !updates.image && updates.images.length > 0) {
      updates.image = updates.images[0];
    }
    const prev = await repositories.events.findById(id);
    const updated = await repositories.events.update(id, updates);
    if (!updated) throw new NotFoundError(`Event not found: ${id}`);
    SyncService.broadcast('events', 'UPDATE', id);
    await repositories.history.record('events', id, 'UPDATE', prev, updated, actor, ip);
    await AuditService.logAction(actor, 'EVENT_UPDATED', 'events', `Updated event: ${updated.title} from IP ${ip}`, {
      resourceId: id,
      ip,
    });
    return updated;
  }

  public static async deleteEvent(id: string, actor = 'System Administrator', ip = '127.0.0.1'): Promise<boolean> {
    const prev = await repositories.events.findById(id);
    const success = await repositories.events.delete(id);
    if (!success) throw new NotFoundError(`Event not found: ${id}`);
    SyncService.broadcast('events', 'DELETE', id);
    await repositories.history.record('events', id, 'DELETE', prev, null, actor, ip);
    await AuditService.logAction(actor, 'EVENT_DELETED', 'events', `Deleted event: ${id} from IP ${ip}`, {
      resourceId: id,
      ip,
    });
    return true;
  }

  public static async deletePhoto(id: string, photoUrl: string, actor = 'System Administrator', ip = '127.0.0.1'): Promise<EventGalleryItem> {
    const prev = await repositories.events.findById(id);
    const updated = await repositories.events.deletePhoto(id, photoUrl);
    if (!updated) throw new NotFoundError(`Event not found: ${id}`);
    SyncService.broadcast('events', 'UPDATE', id);
    await repositories.history.record('events', id, 'UPDATE', prev, updated, actor, ip);
    await AuditService.logAction(actor, 'EVENT_PHOTO_DELETED', 'events', `Deleted photo from event: ${id} from IP ${ip}`, {
      resourceId: id,
      ip,
    });
    return updated;
  }

  public static async listShowcase(): Promise<ShowcaseItem[]> {
    return repositories.showcase.list();
  }

  public static async getShowcaseItem(id: string): Promise<ShowcaseItem> {
    const item = await repositories.showcase.findById(id);
    if (!item) throw new NotFoundError(`Showcase photo not found: ${id}`);
    return item;
  }

  public static async createShowcase(data: Partial<ShowcaseItem>, actor = 'System Administrator', ip = '127.0.0.1'): Promise<ShowcaseItem> {
    const newItem: ShowcaseItem = {
      id: data.id || `SC-${Date.now().toString().slice(-4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      title: data.title || 'Official Visual Showcase',
      caption: data.caption || '',
      image: data.image || '',
      alt: data.alt || data.title || 'Official Visual Showcase Photo',
      tileWide: Boolean(data.tileWide),
      createdAt: new Date().toISOString(),
    };

    const created = await repositories.showcase.create(newItem);
    SyncService.broadcast('showcase', 'CREATE', created.id);
    await repositories.history.record('showcase', created.id, 'CREATE', null, created, actor, ip);
    await AuditService.logAction(actor, 'SHOWCASE_CREATED', 'showcase', `Added showcase photo: ${newItem.title} from IP ${ip}`, {
      resourceId: newItem.id,
      ip,
    });
    return created;
  }

  public static async updateShowcase(id: string, updates: Partial<ShowcaseItem>, actor = 'System Administrator', ip = '127.0.0.1'): Promise<ShowcaseItem> {
    const prev = await repositories.showcase.findById(id);
    const updated = await repositories.showcase.update(id, updates);
    if (!updated) throw new NotFoundError(`Showcase photo not found: ${id}`);
    SyncService.broadcast('showcase', 'UPDATE', id);
    await repositories.history.record('showcase', id, 'UPDATE', prev, updated, actor, ip);
    await AuditService.logAction(actor, 'SHOWCASE_UPDATED', 'showcase', `Updated showcase photo: ${updated.title} from IP ${ip}`, {
      resourceId: id,
      ip,
    });
    return updated;
  }

  public static async deleteShowcase(id: string, actor = 'System Administrator', ip = '127.0.0.1'): Promise<boolean> {
    const prev = await repositories.showcase.findById(id);
    const success = await repositories.showcase.delete(id);
    if (!success) throw new NotFoundError(`Showcase photo not found: ${id}`);
    SyncService.broadcast('showcase', 'DELETE', id);
    await repositories.history.record('showcase', id, 'DELETE', prev, null, actor, ip);
    await AuditService.logAction(actor, 'SHOWCASE_DELETED', 'showcase', `Deleted showcase photo: ${id} from IP ${ip}`, {
      resourceId: id,
      ip,
    });
    return true;
  }
}
