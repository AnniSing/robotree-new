import { Router } from 'express';
import { HealthController } from '../../controllers/HealthController.js';

const router = Router();

router.get('/live', HealthController.getLive);
router.get('/ready', HealthController.getReady);
router.get('/diagnostics', HealthController.getDiagnostics);

export default router;
