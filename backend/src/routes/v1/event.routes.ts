import { Router } from 'express';
import { EventController } from '../../controllers/EventController.js';
import { publicRateLimiter, authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.get('/', publicRateLimiter, EventController.listEvents);
router.get('/showcase', publicRateLimiter, EventController.listShowcase);
router.post('/upload', authRateLimiter, EventController.uploadPhoto);

export default router;
