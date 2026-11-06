import { z } from 'zod';

export const createTeamMemberSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  role: z.string().min(2, 'Role must be at least 2 characters').max(150),
  department: z.string().max(150).optional().default('Training & Curriculum'),
  category: z.enum(['leadership', 'lead-trainers', 'assistant-trainers', 'operations']),
  image: z.string().optional().default(''),
  email: z.string().email('Valid email is required'),
  responsibilities: z.string().max(2000).optional().default(''),
  qualification: z.string().max(100).optional().default(''),
  experience: z.string().max(100).optional().default(''),
  skills: z.array(z.string()).optional().default([]),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();
