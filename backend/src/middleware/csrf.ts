import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { timingSafeEqual } from '../security/timingSafe.js';
import { env, isProduction, isVercel } from '../config/env.js';

const allowedOrigins = new Set(
  env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
);

for (const host of [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
]) {
  if (host) {
    allowedOrigins.add(`https://${host.trim()}`);
  }
}

export function isTrustedVercelOrigin(origin?: string): boolean {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  if (!isProduction || isVercel) {
    try {
      return /\.vercel\.app$/i.test(new URL(origin).hostname);
    } catch {
      return false;
    }
  }
  return false;
}

export function buildCookie(name: string, value: string, maxAgeSec: number, httpOnly = true): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `Max-Age=${maxAgeSec}`,
    `SameSite=Lax`,
  ];
  if (httpOnly) parts.push('HttpOnly');
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

export function sameOriginGuard(req: Request, res: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }
  const origin = req.get('origin');
  const forwardedHost = (req.get('x-forwarded-host') || '').split(',')[0].trim();
  const host = forwardedHost || req.get('host') || '';
  const isLoopback = Boolean(host) && /^127\.0\.0\.1(:\d+)?$|^localhost(:\d+)?$|^0\.0\.0\.0(:\d+)?$/.test(host);
  const isOriginLoopback = Boolean(origin) && /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin || '');
  const isSameHost = Boolean(origin) && Boolean(host) && (origin === `https://${host}` || origin === `http://${host}`);

  if (origin) {
    if (
      isTrustedVercelOrigin(origin) ||
      isSameHost ||
      (isLoopback && isOriginLoopback)
    ) {
      return next();
    }
    res.status(403).json({ success: false, error: 'Forbidden', message: 'Request origin is not allowed.' });
    return;
  }
  next();
}

export function csrfGuard(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  if (req.path === '/generate-pdf' || req.path === '/api/generate-pdf' || req.path === '/certificates/generate-pdf' || req.path === '/v1/certificates/generate-pdf') {
    return next();
  }
  const headerToken = req.get('x-csrf-token') || (req.body && req.body._csrf) || '';
  const parsed = parseCookies(req.get('cookie'));
  const cookieToken = parsed.robotree_csrf || (req as any).cookies?.robotree_csrf || '';

  if (!headerToken || !cookieToken || !timingSafeEqual(headerToken, cookieToken)) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Security token is missing or expired. Please refresh and try again.',
    });
    return;
  }
  next();
}

export function handleCsrfTokenEndpoint(req: Request, res: Response): void {
  const token = crypto.randomBytes(32).toString('hex');
  res.setHeader('Set-Cookie', buildCookie('robotree_csrf', token, 2 * 60 * 60, false));
  res.json({ success: true, csrfToken: token });
}
