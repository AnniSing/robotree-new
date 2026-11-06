import { z } from 'zod';
import path from 'path';
import { PROJECT_ROOT } from '../utils/paths.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),
  ADMIN_PASSCODE: z.string().min(6).default('Aniket4515'),
  SESSION_SECRET: z.string().min(16).default('robotree-enterprise-secret-key-salt-2026-secure'),
  ROBOTREE_DATA_DIR: z.string().default(path.join(PROJECT_ROOT, 'data')),
  DATABASE_URL: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DB_PROVIDER: z.enum(['auto', 'postgres', 'supabase', 'json']).default('auto'),
  MONGODB_URI: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://localhost:5500,http://127.0.0.1:5500,http://0.0.0.0:5000'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const resolvedData = parsed.success ? parsed.data : envSchema.parse({});

// Normalize DATABASE_URL from either DATABASE_URL or SUPABASE_DB_URL
if (!resolvedData.DATABASE_URL && resolvedData.SUPABASE_DB_URL) {
  resolvedData.DATABASE_URL = resolvedData.SUPABASE_DB_URL;
}

export const env = resolvedData;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

if (isProduction) {
  if (env.ADMIN_PASSCODE === 'Aniket4515' || env.SESSION_SECRET === 'robotree-enterprise-secret-key-salt-2026-secure') {
    console.warn('\x1b[33m%s\x1b[0m', '[SECURITY WARNING] Default ADMIN_PASSCODE or SESSION_SECRET detected in production! Set secure production credentials in deployment environment.');
  }
}
