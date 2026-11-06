import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { Logger } from '../telemetry/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.get('x-request-id') || crypto.randomUUID()).slice(0, 36);
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    Logger.info('HTTP_REQUEST', {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
