import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError.js';

interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schema: RequestValidationSchema | ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schema) {
        // Direct body schema
        req.body = await schema.parseAsync(req.body);
      } else {
        if (schema.body) {
          req.body = await schema.body.parseAsync(req.body);
        }
        if (schema.query) {
          req.query = (await schema.query.parseAsync(req.query)) as Request['query'];
        }
        if (schema.params) {
          req.params = (await schema.params.parseAsync(req.params)) as Request['params'];
        }
      }
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError || (err && typeof err === 'object' && ('issues' in err || 'errors' in err))) {
        const issues = (err as any).issues || (err as any).errors || [];
        const details = issues.map((e: any) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message || 'Invalid value',
        }));
        next(new ValidationError(issues[0]?.message || 'Invalid request data', details));
      } else {
        next(err);
      }
    }
  };
}
