/* Robotree Robotics LLP - Enterprise Backend Server Bridge */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Auto-load .env file if present in project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const k = trimmed.substring(0, eqIdx).trim();
        let v = trimmed.substring(eqIdx + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        if (process.env[k] === undefined) {
          process.env[k] = v;
        }
      }
    }
  } catch (_) {}
}

import { app, startServer, COURSES_CATALOG, hashPassword, verifyPassword, sanitizeValue } from './dist-server/app.js';

export * from './dist-server/app.js';
export { app, startServer, COURSES_CATALOG, hashPassword, verifyPassword, sanitizeValue };

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer();
}
