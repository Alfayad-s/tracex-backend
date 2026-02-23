import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

function isPrismaError(err: unknown): err is { code?: string; meta?: unknown } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId ?? 'unknown';
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (isPrismaError(err)) {
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Related record not found';
    }
  }

  if (statusCode >= 500) {
    logger.error(
      {
        err,
        requestId,
        ...(env.isProduction ? {} : { stack: err.stack }),
      },
      message
    );
  } else {
    logger.warn({ requestId, message }, 'Client error');
  }

  const body: { success: false; error: string } = {
    success: false,
    error: message,
  };
  res.status(statusCode).json(body);
}
