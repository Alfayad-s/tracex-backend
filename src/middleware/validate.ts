import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import { AppError } from './error.js';

export function validate(schema: { body: z.ZodType }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.body.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join('; ');
      next(new AppError(400, message));
      return;
    }
    req.body = result.data;
    next();
  };
}
