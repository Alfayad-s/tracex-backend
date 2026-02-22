import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

const HEADER = 'X-Request-ID';

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id = (req.headers[HEADER.toLowerCase()] as string) ?? randomUUID();
  req.requestId = id;
  res.setHeader(HEADER, id);
  next();
}
