import { z } from 'zod';

export const createEventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Event title must be at least 2 characters').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  institution: z.string().max(200).optional().default(''),
  date: z
    .string()
    .max(50)
    .optional()
    .default(() => new Date().toISOString().split('T')[0])
    .transform((v) => (v && v.trim() ? v.trim() : new Date().toISOString().split('T')[0])),
  description: z.string().max(3000).optional().default(''),
  mediaType: z.string().optional().default('image'),
  videoUrl: z.string().optional().or(z.literal('')),
  attendees: z.string().optional().or(z.literal('')),
  duration: z.string().optional().or(z.literal('')),
  image: z.string().optional().default(''),
  images: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

export const updateEventSchema = createEventSchema.partial();

export const deletePhotoSchema = z.object({
  photoUrl: z.string().min(1, 'photoUrl is required').max(500),
});

export const uploadPhotoSchema = z.object({
  adminPasscode: z.string().optional(),
  title: z.string().max(200).optional(),
  imageBase64: z.string().optional(),
  filename: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
  description: z.string().max(3000).optional(),
});
