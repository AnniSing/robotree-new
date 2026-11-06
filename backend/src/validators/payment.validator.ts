import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  courseId: z.string().optional(),
  courseTitle: z.string().optional(),
  amount: z.coerce.number().optional(), // Client may attempt spoofing; backend overrides with catalog!
});

export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(5),
  orderId: z.string().min(5),
  courseId: z.string().optional(),
  courseTitle: z.string().optional(),
  studentName: z.string().min(2),
  email: z.string().email(),
});
