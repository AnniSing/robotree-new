import { z } from 'zod';
import path from 'path';
import { PROJECT_ROOT } from '../utils/paths.js';

const DEFAULT_ADMIN_PASSCODE = 'Aniket4515';
const DEFAULT_SESSION_SECRET = 'robotree-enterprise-secret-key-salt-2026-secure';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  HOST: z.string().default('0.0.0.0'),
  ADMIN_PASSCODE: z.string().min(6).default(DEFAULT_ADMIN_PASSCODE),
  SESSION_SECRET: z.string().min(16).default(DEFAULT_SESSION_SECRET),
  ROBOTREE_DATA_DIR: z.string().default(path.join(PROJECT_ROOT, 'data')),
  DATABASE_URL: z.string().optional(),
  SUPABASE_DB_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional().default(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
  SUPABASE_ANON_KEY: z.string().optional().default(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''),
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

if (!resolvedData.DATABASE_URL && resolvedData.SUPABASE_DB_URL) {
  resolvedData.DATABASE_URL = resolvedData.SUPABASE_DB_URL;
}

export const env = resolvedData;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

if (isProduction) {
  const usingDefaultAdmin = env.ADMIN_PASSCODE === DEFAULT_ADMIN_PASSCODE;
  const usingDefaultSecret = env.SESSION_SECRET === DEFAULT_SESSION_SECRET;

  if (usingDefaultAdmin || usingDefaultSecret) {
    console.error(
      '\x1b[31m%s\x1b[0m',
      '[FATAL SECURITY ERROR] Production must not use default ADMIN_PASSCODE or SESSION_SECRET. ' +
        'Set strong, unique secrets via environment variables before starting the server.'
    );
    process.exit(1);
  }

  const origins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  const hasLoopback = origins.some((o) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(o));
  if (hasLoopback) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '[SECURITY WARNING] ALLOWED_ORIGINS contains loopback origins in production. ' +
        'Remove localhost/127.0.0.1 entries for a hardened production deployment.'
    );
  }
}
