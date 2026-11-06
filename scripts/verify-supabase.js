import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Load .env if present
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.log('\x1b[33m%s\x1b[0m', 'ℹ DATABASE_URL or SUPABASE_DB_URL is not configured in .env. Running in local JSON mode.');
  process.exit(0);
}

const isSupabaseOrRemote =
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase.com') ||
  connectionString.includes('pooler.supabase.com') ||
  connectionString.includes('sslmode=') ||
  process.env.NODE_ENV === 'production';

const pool = new pg.Pool({
  connectionString,
  ssl: isSupabaseOrRemote ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
});

async function verify() {
  try {
    const client = await pool.connect();
    const ver = await client.query('SELECT version()');
    console.log('\x1b[32m%s\x1b[0m', '✔ Connected to Supabase PostgreSQL database!');
    console.log(`Server version: ${ver.rows[0].version}\n`);

    const tables = ['users', 'roles', 'team_members', 'courses', 'products', 'certificates', 'events', 'inquiries', 'audit_logs'];
    for (const t of tables) {
      try {
        const { rows } = await client.query(`SELECT COUNT(*) as c FROM ${t}`);
        console.log(`• Table [${t}]: ${rows[0].c} records`);
      } catch (e) {
        console.log(`• Table [${t}]: NOT FOUND (${e.message})`);
      }
    }
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Could not connect to Supabase: ' + err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verify();
