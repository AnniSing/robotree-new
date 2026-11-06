import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController.js';
import { validateRequest } from '../../validators/validateRequest.js';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  adminLoginSchema,
  deleteAccountSchema,
} from '../../validators/auth.validator.js';
import { requireAuth, requireAdmin } from '../../middleware/authenticate.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authRateLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.get('/me', requireAuth, AuthController.getMe);
router.post('/logout', requireAuth, AuthController.logout);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);
router.get('/export-data', requireAuth, AuthController.exportData);
router.post('/delete-account', requireAuth, validateRequest(deleteAccountSchema), AuthController.deleteAccount);

router.post('/admin/login', authRateLimiter, validateRequest(adminLoginSchema), AuthController.adminLogin);
router.post('/admin/logout', requireAdmin, AuthController.adminLogout);

export default router;
