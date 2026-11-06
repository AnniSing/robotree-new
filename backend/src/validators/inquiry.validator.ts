import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Valid email is required'),
  phone: z.string().max(50).optional().or(z.literal('')),
  interest: z.string().max(1000).optional().or(z.literal('')),
  message: z.string().min(1, 'Message is required').max(5000),
});

export const newsletterSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export const programInterestSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  program: z.string().min(1, 'Program is required').max(200),
});

export const feedbackSchema = z.object({
  name: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  rating: z.coerce.number().min(1).max(5).optional().default(5),
  comments: z.string().max(3000).optional(),
  message: z.string().max(3000).optional(),
}).refine((data) => Boolean((data.comments && data.comments.trim()) || (data.message && data.message.trim())), {
  message: 'Feedback comment or message is required',
  path: ['comments'],
});

export const analyticsEventSchema = z.object({
  event: z.string().min(1).max(100),
  path: z.string().max(200).optional(),
  timestamp: z.string().optional(),
});

export const updateInquirySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'ENROLLED', 'CLOSED', 'ARCHIVED', 'RESPONDED', 'RESOLVED', 'new', 'contacted', 'qualified', 'enrolled', 'closed']).optional(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(3000).optional(),
  interest: z.string().max(1000).optional(),
  message: z.string().max(5000).optional(),
});
