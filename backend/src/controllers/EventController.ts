import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/EventService.js';
import { storageService } from '../services/StorageService.js';
import { ValidationError, UnauthorizedError } from '../errors/AppError.js';
import { getParam } from '../utils/params.js';
import { AuthService } from '../services/AuthService.js';
import { timingSafeEqual } from '../security/timingSafe.js';

export class EventController {
  public static async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await EventService.listEvents();
      res.json({
        success: true,
        count: events.length,
        events,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.createEvent(req.body, req.user?.email || 'Administrator');
      res.status(201).json({
        success: true,
        message: 'Event published successfully.',
        event,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const event = await EventService.updateEvent(id, req.body, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Event updated successfully.',
        event,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      await EventService.deleteEvent(id, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Event removed from gallery.',
        id,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deletePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const { photoUrl } = req.body;
      if (!photoUrl) {
        throw new ValidationError('photoUrl is required');
      }
      const event = await EventService.deletePhoto(id, photoUrl, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Photo removed from event album.',
        event,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async uploadPhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const passcode = String(req.body?.adminPasscode || '').trim();
      const isAdminSession = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN';
      const isPasscodeValid = passcode ? timingSafeEqual(passcode, AuthService.getAdminPasscode()) : false;

      if (!isAdminSession && !isPasscodeValid) {
        throw new UnauthorizedError('Administrative authorization required to upload media or publish gallery items.');
      }

      if (req.body.title) {
        const actor = req.user?.email || (isPasscodeValid ? 'Verified Passcode Admin' : 'Administrator');
        const event = await EventService.createEvent(req.body, actor);
        res.status(201).json({
          success: true,
          message: 'Gallery item published successfully.',
          event,
        });
        return;
      }

      const { imageBase64, filename } = req.body;
      if (!imageBase64) {
        throw new ValidationError('imageBase64 content or event title is required');
      }
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9.+]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const savedPath = await storageService.saveFile(buffer, filename || 'event_photo.jpg', 'gallery');

      res.json({
        success: true,
        url: savedPath,
        message: 'Image uploaded successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async listShowcase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await EventService.listShowcase();
      res.json({
        success: true,
        count: items.length,
        items,
        showcase: items,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createShowcase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let imagePath = req.body.image || '';
      if (req.body.imageBase64) {
        const cleanBase64 = req.body.imageBase64.replace(/^data:image\/[a-z0-9.+]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        imagePath = await storageService.saveFile(buffer, req.body.filename || 'showcase_photo.jpg', 'gallery');
      }

      if (!req.body.title || !req.body.caption) {
        throw new ValidationError('Photo title and caption are required.');
      }

      const item = await EventService.createShowcase({
        ...req.body,
        image: imagePath || req.body.image,
      }, req.user?.email || 'Administrator');

      res.status(201).json({
        success: true,
        message: 'Showcase photo added successfully.',
        item,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateShowcase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      let imagePath = req.body.image;
      if (req.body.imageBase64) {
        const cleanBase64 = req.body.imageBase64.replace(/^data:image\/[a-z0-9.+]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        imagePath = await storageService.saveFile(buffer, req.body.filename || 'showcase_photo.jpg', 'gallery');
      }

      const item = await EventService.updateShowcase(id, {
        ...req.body,
        ...(imagePath ? { image: imagePath } : {}),
      }, req.user?.email || 'Administrator');

      res.json({
        success: true,
        message: 'Showcase photo updated successfully.',
        item,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteShowcase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      await EventService.deleteShowcase(id, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Showcase photo removed.',
        id,
      });
    } catch (err) {
      next(err);
    }
  }
}
