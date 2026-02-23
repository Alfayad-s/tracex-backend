import type { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

type SyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

/**
 * Wraps async route handlers so thrown errors (e.g. AppError) are passed to
 * the error middleware instead of becoming unhandled rejections.
 */
export function asyncHandler(fn: AsyncRequestHandler): SyncRequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
