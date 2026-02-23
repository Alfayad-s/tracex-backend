import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: duration,
      },
      'request completed'
    );
  });
  next();
}
