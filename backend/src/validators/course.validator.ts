import { z } from 'zod';

export const createCourseSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  title: z.string().min(2, 'Course title must be at least 2 characters').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  price: z.coerce.number().min(0, 'Price must be 0 or positive'),
  currency: z.string().default('INR'),
  duration: z.string().max(50).optional().default('6 Weeks').transform((v) => (v && v.trim() ? v.trim() : '6 Weeks')),
  level: z.string().max(50).optional().default('Intermediate').transform((v) => (v && v.trim() ? v.trim() : 'Intermediate')),
  image: z.string().optional().default(''),
  description: z.string().max(3000).optional().default(''),
  modules: z.array(z.string()).optional().default([]),
});

export const updateCourseSchema = createCourseSchema.partial();
