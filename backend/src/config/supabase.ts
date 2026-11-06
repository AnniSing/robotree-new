import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { Logger } from '../telemetry/logger.js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      Logger.info('Supabase client initialized successfully.');
    } catch (err: any) {
      Logger.error('Failed to initialize Supabase client', { details: err.message });
    }
  }
  return supabaseClient;
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      supabaseAdminClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err: any) {
      Logger.error('Failed to initialize Supabase admin client', { details: err.message });
    }
  }
  return supabaseAdminClient;
}

export const supabase = getSupabaseClient();
export const supabaseAdmin = getSupabaseAdminClient();
