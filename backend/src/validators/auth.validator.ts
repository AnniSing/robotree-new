import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  role: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
  resetToken: z.string().optional(),
});

export const adminLoginSchema = z.object({
  passcode: z.string().min(1, 'Passcode is required'),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password confirmation is required to delete account'),
});

export const changeAdminPasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long').max(128),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long').max(128),
  adminPermissionKey: z.string().optional(),
  adminPermissionConfirmed: z.boolean().optional(),
});

export const toggleAdminPermissionLockSchema = z.object({
  locked: z.boolean(),
  adminPermissionKey: z.string().optional(),
});

export const createAdminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6).max(128).optional(),
  role: z.string().max(50).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.string().min(2).max(50),
});

export const updateSettingsSchema = z.object({
  heroStatNumber: z.string().max(50).optional(),
  heroStatLabel: z.string().max(100).optional(),
  governmentProtocol: z.string().max(500).optional(),
});
