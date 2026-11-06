import { z } from 'zod';

export const issueCertificateSchema = z.object({
  studentName: z.string().min(2).max(150),
  studentEmail: z.string().email().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  enrollmentNo: z.string().max(100).optional(),
  enrollmentNumber: z.string().max(100).optional(),
  course: z.string().min(2).max(200).optional(),
  courseTitle: z.string().min(2).max(200).optional(),
  courseName: z.string().min(2).max(200).optional(),
  certificateNumber: z.string().max(100).optional(),
  code: z.string().max(100).optional(),
  issueDate: z.string().optional(),
  grade: z.string().optional(),
  venue: z.string().max(200).optional(),
  time: z.string().max(100).optional(),
  certificateFile: z.string().optional(),
  fileBase64: z.string().optional(),
  fileOriginalName: z.string().max(255).optional(),
});

export const generateCertificateSchema = z.object({
  studentName: z.string().min(2).max(150),
  course: z.string().min(2).max(200).optional(),
  courseTitle: z.string().min(2).max(200).optional(),
  courseId: z.string().optional(),
  issueDate: z.string().optional(),
});

export const certificateIdParamSchema = z.object({
  id: z.string().min(3).max(100),
});

export const generateWorkshopPdfSchema = z.object({
  studentName: z.string().min(1).max(150),
  certId: z.string().min(1).max(100).optional(),
});
