import { Router } from 'express';
import { CourseController } from '../../controllers/CourseController.js';
import { validateRequest } from '../../validators/validateRequest.js';
import { createPaymentOrderSchema, verifyPaymentSchema } from '../../validators/payment.validator.js';

const router = Router();

router.post('/create-order', validateRequest(createPaymentOrderSchema), CourseController.createOrder);
router.post('/verify', validateRequest(verifyPaymentSchema), CourseController.verifyPayment);

export default router;
