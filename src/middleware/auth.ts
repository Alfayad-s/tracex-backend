import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error.js';
import { verifyToken } from '../utils/jwt.js';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      throw new AppError(401, 'Missing or invalid authorization');
    }
    const payload = await verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    if (e instanceof AppError) next(e);
    else next(new AppError(401, 'Invalid or expired token'));
  }
}
