import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { AppError } from './error.js';

type SchemaMap = {
  body?: z.ZodType<unknown>;
  query?: z.ZodType<unknown>;
  params?: z.ZodType<unknown>;
};

export function validate(schemas: SchemaMap) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const parsed = (schemas.body as z.ZodType<Request['body']>).safeParse(req.body);
        if (!parsed.success) {
          const msg = parsed.error.errors.map((e) => e.message).join('; ') || 'Validation failed';
          throw new AppError(400, msg);
        }
        req.body = parsed.data;
      }
      if (schemas.query) {
        const parsed = (schemas.query as z.ZodType<Request['query']>).safeParse(req.query);
        if (!parsed.success) {
          const msg = parsed.error.errors.map((e) => e.message).join('; ') || 'Validation failed';
          throw new AppError(400, msg);
        }
        req.query = parsed.data;
      }
      if (schemas.params) {
        const parsed = (schemas.params as z.ZodType<Request['params']>).safeParse(req.params);
        if (!parsed.success) {
          const msg = parsed.error.errors.map((e) => e.message).join('; ') || 'Validation failed';
          throw new AppError(400, msg);
        }
        req.params = parsed.data;
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}
