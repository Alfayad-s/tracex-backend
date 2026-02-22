import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId ?? 'unknown';
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error({ err, requestId }, message);
  } else {
    logger.warn({ requestId, message }, 'Client error');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
