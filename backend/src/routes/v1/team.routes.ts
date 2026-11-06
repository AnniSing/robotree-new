import { Router } from 'express';
import { TeamController } from '../../controllers/TeamController.js';
import { publicRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.get('/', publicRateLimiter, TeamController.listTeam);

export default router;
