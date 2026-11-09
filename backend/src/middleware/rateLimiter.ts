import { Request, Response, NextFunction } from 'express';
import { isTest } from '../config/env.js';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export function createRateLimiter(config: RateLimitConfig) {
  const requests = new Map<string, number[]>();

  // Periodically purge stale IP entries to prevent unbounded memory growth in production
  if (!isTest) {
    const cleanupInterval = Math.max(60000, config.windowMs);
    setInterval(() => {
      const windowStart = Date.now() - config.windowMs;
      for (const [ip, timestamps] of requests.entries()) {
        const valid = timestamps.filter((t) => t > windowStart);
        if (valid.length === 0) {
          requests.delete(ip);
        } else if (valid.length !== timestamps.length) {
          requests.set(ip, valid);
        }
      }
    }, cleanupInterval).unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // Relaxed in automated test environment
    if (isTest) {
      return next();
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let timestamps = requests.get(ip) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= config.maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: config.message,
      });
      return;
    }

    timestamps.push(now);
    requests.set(ip, timestamps);
    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

export const certificateRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Verification request limit exceeded. Please wait a minute.',
});

export const publicRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 200,
  message: 'Request limit reached. Please slow down.',
});

export const formRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Too many form submissions. Please try again in a minute.',
});
