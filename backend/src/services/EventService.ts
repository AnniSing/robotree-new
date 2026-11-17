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

  public static async createEvent(data: Partial<EventGalleryItem>, actor = 'System Administrator'): Promise<EventGalleryItem> {
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
    await AuditService.logAction(actor, 'EVENT_CREATED', 'events', `Created event: ${newEvent.title}`, {
      resourceId: newEvent.id,
    });
    return created;
  }

  public static async updateEvent(id: string, updates: Partial<EventGalleryItem>, actor = 'System Administrator'): Promise<EventGalleryItem> {
    if (updates.images && !updates.image && updates.images.length > 0) {
      updates.image = updates.images[0];
    }
    const updated = await repositories.events.update(id, updates);
    if (!updated) throw new NotFoundError(`Event not found: ${id}`);
    SyncService.broadcast('events', 'UPDATE', id);
    await AuditService.logAction(actor, 'EVENT_UPDATED', 'events', `Updated event: ${updated.title}`, {
      resourceId: id,
    });
    return updated;
  }

  public static async deleteEvent(id: string, actor = 'System Administrator'): Promise<boolean> {
    const success = await repositories.events.delete(id);
    if (!success) throw new NotFoundError(`Event not found: ${id}`);
    SyncService.broadcast('events', 'DELETE', id);
    await AuditService.logAction(actor, 'EVENT_DELETED', 'events', `Deleted event: ${id}`, {
      resourceId: id,
    });
    return true;
  }

  public static async deletePhoto(id: string, photoUrl: string, actor = 'System Administrator'): Promise<EventGalleryItem> {
    const updated = await repositories.events.deletePhoto(id, photoUrl);
    if (!updated) throw new NotFoundError(`Event not found: ${id}`);
    SyncService.broadcast('events', 'UPDATE', id);
    await AuditService.logAction(actor, 'EVENT_PHOTO_DELETED', 'events', `Deleted photo from event: ${id}`, {
      resourceId: id,
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

  public static async createShowcase(data: Partial<ShowcaseItem>, actor = 'System Administrator'): Promise<ShowcaseItem> {
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
    await AuditService.logAction(actor, 'SHOWCASE_CREATED', 'showcase', `Added showcase photo: ${newItem.title}`, {
      resourceId: newItem.id,
    });
    return created;
  }

  public static async updateShowcase(id: string, updates: Partial<ShowcaseItem>, actor = 'System Administrator'): Promise<ShowcaseItem> {
    const updated = await repositories.showcase.update(id, updates);
    if (!updated) throw new NotFoundError(`Showcase photo not found: ${id}`);
    SyncService.broadcast('showcase', 'UPDATE', id);
    await AuditService.logAction(actor, 'SHOWCASE_UPDATED', 'showcase', `Updated showcase photo: ${updated.title}`, {
      resourceId: id,
    });
    return updated;
  }

  public static async deleteShowcase(id: string, actor = 'System Administrator'): Promise<boolean> {
    const success = await repositories.showcase.delete(id);
    if (!success) throw new NotFoundError(`Showcase photo not found: ${id}`);
    SyncService.broadcast('showcase', 'DELETE', id);
    await AuditService.logAction(actor, 'SHOWCASE_DELETED', 'showcase', `Deleted showcase photo: ${id}`, {
      resourceId: id,
    });
    return true;
  }
}
