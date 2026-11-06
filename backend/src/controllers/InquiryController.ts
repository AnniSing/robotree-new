import { Request, Response, NextFunction } from 'express';
import { InquiryService } from '../services/InquiryService.js';
import { getParam } from '../utils/params.js';

export class InquiryController {
  public static async submitContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InquiryService.submitContact(req.body);
      res.json({
        success: true,
        message: 'Thank you. Your message has been received and routed to our team.',
        inquiryId: result.inquiryId,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async subscribeNewsletter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await InquiryService.subscribeNewsletter(req.body.email);
      res.json({
        success: true,
        message: 'Subscribed successfully to Robotree Robotics technology newsletter.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async recordProgramInterest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await InquiryService.recordProgramInterest(req.body);
      res.json({
        success: true,
        message: 'Program interest recorded. An advisor will contact you shortly.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await InquiryService.submitFeedback(req.body);
      res.json({
        success: true,
        message: 'Feedback received. Thank you for helping us improve.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async recordAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await InquiryService.recordAnalytics(req.body, req.ip);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  public static async listInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await InquiryService.listInquiries();
      res.json({
        success: true,
        count: list.length,
        inquiries: list,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const updated = await InquiryService.updateInquiry(id, req.body);
      res.json({
        success: true,
        inquiry: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      await InquiryService.deleteInquiry(id);
      res.json({
        success: true,
        message: 'Inquiry lead deleted.',
      });
    } catch (err) {
      next(err);
    }
  }
}
