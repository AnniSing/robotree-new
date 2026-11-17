import { Request } from 'express';

/**
 * Extracts and normalizes the client/system IP address from an Express request.
 * Handles reverse proxies (Render, AWS ALB, Nginx, Cloudflare) and IPv6 loopback formats.
 */
export function extractClientIp(req: Request): string {
  // 1. Cloudflare header
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cleanIp(cfIp.trim());
  }

  // 2. Standard X-Forwarded-For header (first entry is the real client IP)
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return cleanIp(firstIp);
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    const firstIp = String(forwarded[0]).split(',')[0].trim();
    if (firstIp) return cleanIp(firstIp);
  }

  // 3. X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return cleanIp(realIp.trim());
  }

  // 4. Express req.ip (when trust proxy is configured)
  if (req.ip && typeof req.ip === 'string') {
    return cleanIp(req.ip);
  }

  // 5. Socket remote address
  if (req.socket?.remoteAddress) {
    return cleanIp(req.socket.remoteAddress);
  }

  return '127.0.0.1';
}

/**
 * Normalizes IPv6 IPv4-mapped addresses and loopback addresses
 */
export function cleanIp(rawIp: string): string {
  let ip = (rawIp || '').trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  if (ip === '::1') {
    ip = '127.0.0.1';
  }
  return ip || '127.0.0.1';
}
