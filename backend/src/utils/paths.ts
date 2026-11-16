import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getProjectRoot(): string {
  const isRealRoot = (dir: string) => {
    try {
      return (
        fs.existsSync(path.join(dir, 'server.js')) &&
        (fs.existsSync(path.join(dir, 'admin.html')) || fs.existsSync(path.join(dir, 'backend')))
      );
    } catch {
      return false;
    }
  };

  const cwd = process.cwd();
  if (isRealRoot(cwd)) {
    return cwd;
  }
  if (isRealRoot(path.join(cwd, 'robotree.in-main'))) {
    return path.join(cwd, 'robotree.in-main');
  }

  const candidates = [
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '../../..'),
  ];

  for (const candidate of candidates) {
    if (isRealRoot(candidate)) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
  }

  return cwd;
}

export const PROJECT_ROOT = getProjectRoot();
