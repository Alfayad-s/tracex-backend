import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from './error.js';
import { verifyToken } from '../utils/jwt.js';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });
    if (!user) {
      next(new AppError(401, 'User not found'));
      return;
    }
    req.user = { id: user.id, email: user.email };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}
