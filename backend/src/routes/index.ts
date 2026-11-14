import { Router } from 'express';
import authRoutes from './v1/auth.routes.js';
import certificateRoutes from './v1/certificate.routes.js';
import courseRoutes from './v1/course.routes.js';
import teamRoutes from './v1/team.routes.js';
import eventRoutes from './v1/event.routes.js';
import paymentRoutes from './v1/payment.routes.js';
import adminRoutes from './v1/admin.routes.js';
import healthRoutes from './v1/health.routes.js';
import employeeRoutes from './v1/employee.routes.js';
import productRoutes from './v1/product.routes.js';
import { AuthController } from '../controllers/AuthController.js';
import { InquiryController } from '../controllers/InquiryController.js';
import { HealthController } from '../controllers/HealthController.js';
import { AdminController } from '../controllers/AdminController.js';
import { EventController } from '../controllers/EventController.js';
import { CertificateController } from '../controllers/CertificateController.js';
import { handleCsrfTokenEndpoint } from '../middleware/csrf.js';
import { validateRequest } from '../validators/validateRequest.js';
import {
  contactSchema,
  newsletterSchema,
  programInterestSchema,
  feedbackSchema,
  analyticsEventSchema,
} from '../validators/inquiry.validator.js';
import { adminLoginSchema } from '../validators/auth.validator.js';
import { requireAdmin } from '../middleware/authenticate.js';
import { authRateLimiter, formRateLimiter } from '../middleware/rateLimiter.js';

export function createApiRouter(): Router {
  const router = Router();

  // CSRF token generator
  router.get('/csrf-token', handleCsrfTokenEndpoint);
  router.get('/v1/csrf-token', handleCsrfTokenEndpoint);

  // Health & Diagnostics
  router.get('/health', HealthController.getLive);
  router.get('/health/live', HealthController.getLive);
  router.get('/health/ready', HealthController.getReady);
  router.get('/health/diagnostics', HealthController.getDiagnostics);
  router.use('/v1/health', healthRoutes);

  // Public site content & settings
  router.get('/site-settings', AdminController.getPublicSettings);
  router.get('/v1/site-settings', AdminController.getPublicSettings);

  // Inbound public forms
  router.post('/contact', formRateLimiter, validateRequest(contactSchema), InquiryController.submitContact);
  router.post('/v1/contact', formRateLimiter, validateRequest(contactSchema), InquiryController.submitContact);
  router.post('/inquiries', formRateLimiter, validateRequest(contactSchema), InquiryController.submitContact);
  router.post('/v1/inquiries', formRateLimiter, validateRequest(contactSchema), InquiryController.submitContact);

  router.post('/newsletter', formRateLimiter, validateRequest(newsletterSchema), InquiryController.subscribeNewsletter);
  router.post('/v1/newsletter', formRateLimiter, validateRequest(newsletterSchema), InquiryController.subscribeNewsletter);

  router.post('/program-interest', formRateLimiter, validateRequest(programInterestSchema), InquiryController.recordProgramInterest);
  router.post('/v1/program-interest', formRateLimiter, validateRequest(programInterestSchema), InquiryController.recordProgramInterest);

  router.post('/feedback', formRateLimiter, validateRequest(feedbackSchema), InquiryController.submitFeedback);
  router.post('/v1/feedback', formRateLimiter, validateRequest(feedbackSchema), InquiryController.submitFeedback);

  router.post('/analytics/event', formRateLimiter, validateRequest(analyticsEventSchema), InquiryController.recordAnalytics);
  router.post('/v1/analytics/event', formRateLimiter, validateRequest(analyticsEventSchema), InquiryController.recordAnalytics);

  // Direct uploads & activity log compatibility
  router.get('/showcase', EventController.listShowcase);
  router.get('/v1/showcase', EventController.listShowcase);
  router.post('/gallery/upload', authRateLimiter, EventController.uploadPhoto);
  router.get('/activity-logs', requireAdmin, AdminController.getActivityLogs);
  router.post('/generate-pdf', requireAdmin, CertificateController.generateWorkshopPdf);
  router.post('/v1/generate-pdf', requireAdmin, CertificateController.generateWorkshopPdf);

  // Public admin authentication endpoints (unprotected by requireAdmin)
  router.post('/admin/login', authRateLimiter, validateRequest(adminLoginSchema), AuthController.adminLogin);
  router.post('/admin/logout', requireAdmin, AuthController.adminLogout);
  router.post('/v1/admin/login', authRateLimiter, validateRequest(adminLoginSchema), AuthController.adminLogin);
  router.post('/v1/admin/logout', requireAdmin, AuthController.adminLogout);

  // Versioned v1 sub-routers
  router.use('/v1/auth', authRoutes);
  router.use('/v1/certificates', certificateRoutes);
  router.use('/v1/courses', courseRoutes);
  router.use('/v1/team', teamRoutes);
  router.use('/v1/events', eventRoutes);
  router.use('/v1/payments', paymentRoutes);
  router.use('/v1/admin', adminRoutes);

  // Employee portal routes
  router.use('/v1/employee', employeeRoutes);

  // Store & E-Commerce catalog & orders
  router.use('/v1/store', productRoutes);

  // Unversioned transparent aliases for 100% frontend and test compatibility
  router.use('/auth', authRoutes);
  router.use('/certificates', certificateRoutes);
  router.use('/courses', courseRoutes);
  router.use('/team', teamRoutes);
  router.use('/events', eventRoutes);
  router.use('/payments', paymentRoutes);
  router.use('/admin', adminRoutes);
  router.use('/employee', employeeRoutes);
  router.use('/store', productRoutes);

  // Catch-all handler for unhandled API endpoints to guarantee valid JSON responses
  router.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl || req.url} not found.`
    });
  });

  return router;
}
