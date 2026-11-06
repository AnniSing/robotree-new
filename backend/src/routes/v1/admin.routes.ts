import { Router } from 'express';
import { requireAdmin } from '../../middleware/authenticate.js';
import { AdminController } from '../../controllers/AdminController.js';
import { EventController } from '../../controllers/EventController.js';
import { TeamController } from '../../controllers/TeamController.js';
import { CourseController } from '../../controllers/CourseController.js';
import { InquiryController } from '../../controllers/InquiryController.js';
import { CertificateController } from '../../controllers/CertificateController.js';
import { ProductController } from '../../controllers/ProductController.js';
import { validateRequest } from '../../validators/validateRequest.js';
import { createEventSchema, updateEventSchema } from '../../validators/event.validator.js';
import { createTeamMemberSchema, updateTeamMemberSchema } from '../../validators/team.validator.js';
import { createCourseSchema, updateCourseSchema } from '../../validators/course.validator.js';
import { issueCertificateSchema } from '../../validators/certificate.validator.js';
import { changeAdminPasswordSchema, toggleAdminPermissionLockSchema } from '../../validators/auth.validator.js';
import { createProductSchema, updateProductSchema } from '../../validators/product.validator.js';

const router = Router();

// Enforce admin role on all admin routes
router.use(requireAdmin);

// Dashboard & Telemetry
router.get('/dashboard', AdminController.getDashboard);
router.get('/activity-logs', AdminController.getActivityLogs);

// Security & Password Management
router.get('/permission-status', AdminController.getPermissionStatus);
router.post('/toggle-permission-lock', validateRequest(toggleAdminPermissionLockSchema), AdminController.togglePermissionLock);
router.post('/change-password', validateRequest(changeAdminPasswordSchema), AdminController.changePassword);

// Website Content & Settings Management
router.get('/settings', AdminController.getSettings);
router.put('/settings', AdminController.updateSettings);

// User Accounts & Team Access Management
router.post('/users', AdminController.createUser);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/role', AdminController.updateUserRole);

// Events Management
router.post('/events', validateRequest(createEventSchema), EventController.createEvent);
router.put('/events/:id', validateRequest(updateEventSchema), EventController.updateEvent);
router.delete('/events/:id', EventController.deleteEvent);
router.post('/events/:id/delete-photo', EventController.deletePhoto);

// Visual Showcase Photos Management
router.get('/showcase', EventController.listShowcase);
router.post('/showcase', EventController.createShowcase);
router.put('/showcase/:id', EventController.updateShowcase);
router.delete('/showcase/:id', EventController.deleteShowcase);

// Team Management
router.post('/team', validateRequest(createTeamMemberSchema), TeamController.createTeamMember);
router.put('/team/:id', validateRequest(updateTeamMemberSchema), TeamController.updateTeamMember);
router.delete('/team/:id', TeamController.deleteTeamMember);

// Course Management
router.post('/courses', validateRequest(createCourseSchema), CourseController.createCourse);
router.put('/courses/:id', validateRequest(updateCourseSchema), CourseController.updateCourse);
router.delete('/courses/:id', CourseController.deleteCourse);

// Inquiry Leads
router.get('/inquiries', InquiryController.listInquiries);
router.put('/inquiries/:id', InquiryController.updateInquiry);
router.delete('/inquiries/:id', InquiryController.deleteInquiry);

// Certificates Management
router.post('/certificates/issue', validateRequest(issueCertificateSchema), CertificateController.issueAdmin);
router.post('/certificates/:id/revoke', CertificateController.revoke);
router.post('/certificates/:id/reinstate', CertificateController.reinstate);
router.delete('/certificates/:id', CertificateController.delete);

// Store Products Management
router.post('/products', validateRequest(createProductSchema), ProductController.create);
router.put('/products/:id', validateRequest(updateProductSchema), ProductController.update);
router.delete('/products/:id', ProductController.delete);
router.patch('/products/:id/stock', ProductController.toggleStock);

export default router;
