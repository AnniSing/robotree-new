import { Router } from 'express';
import { EventController } from '../../controllers/EventController.js';
import { publicRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.get('/', publicRateLimiter, EventController.listEvents);
router.get('/showcase', publicRateLimiter, EventController.listShowcase);
router.post('/upload', EventController.uploadPhoto);

export default router;
