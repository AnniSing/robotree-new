import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { Logger } from '../telemetry/logger.js';
import { isProduction } from '../config/env.js';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId || 'req_unknown';

  if (err instanceof AppError) {
    Logger.warn(`AppError [${err.code}]: ${err.message}`, {
      requestId,
      status: err.statusCode,
      path: req.path,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    });
    return;
  }

  // Unexpected or unhandled server error
  Logger.error(`Unhandled Error: ${err.message}`, {
    requestId,
    path: req.path,
    details: isProduction ? undefined : err.stack,
  });

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: isProduction ? 'An unexpected server error occurred.' : err.message,
    requestId,
  });
}
