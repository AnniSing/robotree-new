/**
 * Domain Models for Robotree Backend Architecture (MVC + Services)
 */

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'STUDENT' | 'PUBLIC' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  lockUntil?: string;
  resetToken?: string;
  resetTokenExpires?: string;
}

export interface Session {
  id: string;
  userId: string;
  role: Role;
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  lastActive: string;
}

export type CertificateStatus = 'ISSUED' | 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'REPLACED';

export interface Certificate {
  id: string; // RRT-YYYY-XXXX-XXXX
  code: string;
  certificateNumber?: string;
  enrollmentNo?: string;
  enrollmentNumber?: string;
  certificateFile?: string;
  fileOriginalName?: string;
  studentName: string;
  studentEmail?: string;
  course: string;
  courseTitle?: string;
  issueDate: string;
  status: CertificateStatus;
  verificationHash: string;
  issuer: string;
  grade?: string;
  venue?: string;
  time?: string;
  revokedAt?: string;
  revokedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  title: string;
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  duration: string;
  level: string;
  image: string;
  description: string;
  modules: string[];
}

export interface TeamMember {
  id: number | string;
  name: string;
  role: string;
  department: string;
  category: 'leadership' | 'lead-trainers' | 'assistant-trainers' | 'operations';
  image: string;
  email: string;
  responsibilities: string;
  qualification: string;
  experience: string;
  skills: string[];
}

export interface EventGalleryItem {
  id: string;
  title: string;
  category: string;
  institution: string;
  date: string;
  description: string;
  image: string;
  images: string[];
  tags: string[];
}

export interface ShowcaseItem {
  id: string;
  title: string;
  caption: string;
  image: string;
  alt?: string;
  tileWide?: boolean;
  createdAt?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  interest?: string;
  message?: string;
  source?: string;
  rating?: number;
  status?: string;
  notes?: string;
  orderId?: string;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  items?: any[];
  totalAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsletterSubscription {
  email: string;
  subscribedAt: string;
}

export interface ProgramInterest {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  program: string;
  recordedAt: string;
}

export interface UserFeedback {
  id?: string;
  rating: number;
  comment?: string;
  submittedAt: string;
}

export interface AnalyticsEvent {
  event: string;
  payload?: any;
  timestamp: string;
}

export interface SiteSettings {
  heroStatNumber: string;
  heroStatLabel: string;
  governmentProtocol: string;
  adminPasscode?: string;
  adminPasscodeHash?: string;
  adminPasswordUpdatedAt?: string;
  adminPasswordPermissionLocked?: boolean;
  adminPermissionKey?: string;
  adminPermissionKeyHash?: string;
  adminPermissionUpdatedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  resourceId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export * from './Product.js';

