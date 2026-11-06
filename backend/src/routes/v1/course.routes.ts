import { Router } from 'express';
import { CourseController } from '../../controllers/CourseController.js';
import { publicRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.get('/', publicRateLimiter, CourseController.listCourses);

export default router;
