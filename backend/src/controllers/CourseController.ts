import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/CourseService.js';
import { db } from '../persistence/json-database.js';
import { getParam } from '../utils/params.js';

export class CourseController {
  public static async listCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const courses = await CourseService.listCourses();
      res.json({
        success: true,
        count: courses.length,
        courses,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const course = await CourseService.createCourse(req.body, req.user?.email || 'Administrator');
      res.status(201).json({
        success: true,
        message: 'Course track created successfully.',
        course,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const course = await CourseService.updateCourse(id, req.body, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Course track updated successfully.',
        course,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      await CourseService.deleteCourse(id, req.user?.email || 'Administrator');
      res.json({
        success: true,
        message: 'Course track deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static createOrder(req: Request, res: Response, next: NextFunction): void {
    try {
      const { courseId, courseTitle } = req.body;
      const order = CourseService.createPaymentOrder(courseId, courseTitle);
      res.json({
        success: true,
        ...order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static verifyPayment(req: Request, res: Response, next: NextFunction): void {
    try {
      const { paymentId, orderId, courseId, courseTitle, studentName, email } = req.body;
      const order = CourseService.createPaymentOrder(courseId, courseTitle);

      const applications = db.getApplications();
      const newRecord = {
        id: 'PAY_' + Date.now(),
        name: studentName,
        email,
        role: `Paid Enrollment: ${order.courseTitle}`,
        paymentId,
        orderId,
        amount: order.amount,
        currency: order.currency,
        submittedAt: new Date().toISOString(),
        status: 'PAID',
      };
      applications.unshift(newRecord);
      db.saveApplications(applications);

      res.json({
        success: true,
        message: 'Payment verified and enrollment confirmed.',
        enrollmentId: newRecord.id,
      });
    } catch (err) {
      next(err);
    }
  }
}
