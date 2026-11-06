import crypto from 'node:crypto';
import { hash, verify, hashSync, verifySync, Algorithm } from '@node-rs/argon2';
import { timingSafeEqual } from './timingSafe.js';

export function hashPassword(password: string): string {
  const iterations = 210000;
  const salt = crypto.randomBytes(16).toString('hex');
  const hashVal = crypto.pbkdf2Sync(String(password), salt, iterations, 32, 'sha256').toString('hex');
  return `pbkdf2_sha256$${iterations}$${salt}$${hashVal}`;
}

export function hashArgon2idSync(password: string): string {
  return hashSync(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function hashArgon2id(password: string): Promise<string> {
  return hash(password, {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export function verifyPassword(password: string, storedHash = ''): { valid: boolean; needsRehash: boolean } {
  const value = String(storedHash || '');
  if (value.startsWith('pbkdf2_sha256$')) {
    const [, iterationsRaw, salt, expected] = value.split('$');
    const iterations = Number(iterationsRaw);
    if (!iterations || !salt || !expected) return { valid: false, needsRehash: false };
    const actual = crypto.pbkdf2Sync(String(password), salt, iterations, 32, 'sha256').toString('hex');
    return { valid: timingSafeEqual(actual, expected), needsRehash: iterations < 210000 };
  }
  if (value.startsWith('$argon2')) {
    try {
      const valid = verifySync(value, password);
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }
  return { valid: false, needsRehash: false };
}

export function sanitizeValue(value: string, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}
