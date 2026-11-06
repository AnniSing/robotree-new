import { Request } from 'express';

export function getParam(req: Request, name: string): string {
  const val = req.params[name];
  if (Array.isArray(val)) {
    return val[0] || '';
  }
  return typeof val === 'string' ? val : '';
}
