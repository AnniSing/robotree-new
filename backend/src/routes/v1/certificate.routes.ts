import { Router } from 'express';
import { CertificateController } from '../../controllers/CertificateController.js';
import { validateRequest } from '../../validators/validateRequest.js';
import {
  generateCertificateSchema,
  certificateIdParamSchema,
} from '../../validators/certificate.validator.js';
import { requireAdmin } from '../../middleware/authenticate.js';
import { certificateRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.get('/verify/:id', certificateRateLimiter, validateRequest({ params: certificateIdParamSchema }), CertificateController.verify);
router.get('/download/:id', validateRequest({ params: certificateIdParamSchema }), CertificateController.download);
// Certificate generation is strictly restricted to Administrators only
router.post('/generate', requireAdmin, validateRequest(generateCertificateSchema), CertificateController.generate);
router.post('/generate-pdf', requireAdmin, CertificateController.generateWorkshopPdf);

export default router;
