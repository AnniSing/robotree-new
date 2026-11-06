/* Robotree Robotics LLP - Enterprise Backend Server Bridge */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, startServer, COURSES_CATALOG, hashPassword, verifyPassword, sanitizeValue } from './dist-server/app.js';

export * from './dist-server/app.js';
export { app, startServer, COURSES_CATALOG, hashPassword, verifyPassword, sanitizeValue };

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer();
}
