import { repositories } from '../repositories/index.js';
import { Course } from '../types/index.js';
import { NotFoundError } from '../errors/AppError.js';
import { AuditService } from './AuditService.js';
import crypto from 'node:crypto';

// Server-side authoritative Course & Price Catalog (INR)
export const COURSES_CATALOG: Record<string, { id: string; title: string; price: number; currency: string }> = {
  'robotics-workshop-free': {
    id: 'robotics-workshop-free',
    title: 'FREE Robotics Workshop for Children (Class 2 to 7)',
    price: 0,
    currency: 'INR',
  },
  'basic-robotics': {
    id: 'basic-robotics',
    title: 'Basic Robotics (Foundations & Bot Building)',
    price: 1999,
    currency: 'INR',
  },
  'adv-robotics-arduino': {
    id: 'adv-robotics-arduino',
    title: 'Advanced Robotics & Arduino Programming',
    price: 2499,
    currency: 'INR',
  },
  'space-technology': {
    id: 'space-technology',
    title: 'Space Technology & Satellite Engineering',
    price: 4999,
    currency: 'INR',
  },
  'ai-ml-masterclass': {
    id: 'ai-ml-masterclass',
    title: 'Artificial Intelligence & Machine Learning',
    price: 3499,
    currency: 'INR',
  },
  'drone-aerial-robotics': {
    id: 'drone-aerial-robotics',
    title: 'Drone Technology & Aerial Robotics',
    price: 4499,
    currency: 'INR',
  },
  'iot-smart-systems': {
    id: 'iot-smart-systems',
    title: 'IoT (Internet of Things) & Smart Systems',
    price: 2999,
    currency: 'INR',
  },
  'cyber-security': {
    id: 'cyber-security',
    title: 'Cyber Security & Programming (Ethical Hacking)',
    price: 3999,
    currency: 'INR',
  },
  '3d-printing': {
    id: '3d-printing',
    title: '3D Design & Printing Prototyping',
    price: 2499,
    currency: 'INR',
  },
  'fullstack-web-app': {
    id: 'fullstack-web-app',
    title: 'Web Development (Full-Stack & UX)',
    price: 4999,
    currency: 'INR',
  },
  'robotics': {
    id: 'robotics',
    title: 'Basic & Advanced Robotics',
    price: 2499,
    currency: 'INR',
  },
  'ai-iot': {
    id: 'ai-iot',
    title: 'AI, IoT & Programming',
    price: 3499,
    currency: 'INR',
  },
  'drone-technology': {
    id: 'drone-technology',
    title: 'Drone Technology & Aerial Robotics',
    price: 4499,
    currency: 'INR',
  },
  'cybersecurity': {
    id: 'cybersecurity',
    title: 'Cybersecurity & Ethical Hacking',
    price: 3999,
    currency: 'INR',
  },
  'web-development': {
    id: 'web-development',
    title: 'Web Development (Full-Stack & UX)',
    price: 4999,
    currency: 'INR',
  },
  'social-media-marketing': {
    id: 'social-media-marketing',
    title: 'Social Media Marketing & Brand Management',
    price: 3999,
    currency: 'INR',
  },
  'ar-vr-immersive': {
    id: 'ar-vr-immersive',
    title: 'AR/VR & Immersive Media Prototyping',
    price: 3999,
    currency: 'INR',
  },
};

export class CourseService {
  public static async listCourses(): Promise<Course[]> {
    return repositories.courses.list();
  }

  public static async getCourse(id: string): Promise<Course> {
    const course = await repositories.courses.findById(id);
    if (!course) throw new NotFoundError(`Course not found: ${id}`);
    return course;
  }

  public static async createCourse(course: Course, actor = 'System Administrator'): Promise<Course> {
    if (!course.id) {
      course.id = course.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `course-${Date.now()}`;
    }
    const created = await repositories.courses.create(course);
    await AuditService.logAction(actor, 'COURSE_CREATED', 'courses', `Created course: ${course.title}`, {
      resourceId: course.id,
    });
    return created;
  }

  public static async updateCourse(id: string, updates: Partial<Course>, actor = 'System Administrator'): Promise<Course> {
    const updated = await repositories.courses.update(id, updates);
    if (!updated) throw new NotFoundError(`Course not found: ${id}`);
    await AuditService.logAction(actor, 'COURSE_UPDATED', 'courses', `Updated course: ${updated.title}`, {
      resourceId: id,
    });
    return updated;
  }

  public static async deleteCourse(id: string, actor = 'System Administrator'): Promise<boolean> {
    const success = await repositories.courses.delete(id);
    if (!success) throw new NotFoundError(`Course not found: ${id}`);
    await AuditService.logAction(actor, 'COURSE_DELETED', 'courses', `Deleted course: ${id}`, {
      resourceId: id,
    });
    return true;
  }

  /**
   * Authoritative server-side order creation.
   * Client-supplied amount is intentionally ignored to prevent price tampering!
   */
  public static createPaymentOrder(courseId?: string, courseTitle?: string): {
    orderId: string;
    amount: number;
    currency: string;
    courseTitle: string;
    courseId: string;
  } {
    let selected = Object.values(COURSES_CATALOG).find(
      (c) => c.id === courseId || c.title.toLowerCase() === (courseTitle || '').toLowerCase()
    );

    if (!selected) {
      selected = COURSES_CATALOG['adv-robotics-arduino'];
    }

    const orderId = 'order_' + crypto.randomBytes(10).toString('hex');

    return {
      orderId,
      amount: selected.price,
      currency: selected.currency,
      courseTitle: selected.title,
      courseId: selected.id,
    };
  }
}
