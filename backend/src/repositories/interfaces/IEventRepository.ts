import { EventGalleryItem } from '../../types/index.js';

export interface IEventRepository {
  list(): Promise<EventGalleryItem[]>;
  findById(id: string): Promise<EventGalleryItem | null>;
  create(event: EventGalleryItem): Promise<EventGalleryItem>;
  update(id: string, updates: Partial<EventGalleryItem>): Promise<EventGalleryItem | null>;
  delete(id: string): Promise<boolean>;
  deletePhoto(eventId: string, photoUrl: string): Promise<EventGalleryItem | null>;
}
