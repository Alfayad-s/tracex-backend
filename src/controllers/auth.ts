import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import type { SignUpBody, SignInBody } from '../schemas/auth.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

function toUserResponse(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: toUserResponse(user) });
  } catch (e) {
    next(e);
  }
}

export async function signUp(
  req: Request<object, object, SignUpBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(400, 'Email already registered');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, name: true },
    });
    const access_token = await signToken({ sub: user.id, email: user.email });
    res.status(201).json({
      success: true,
      data: { user: toUserResponse(user), access_token },
    });
  } catch (e) {
    next(e);
  }
}

export async function signIn(
  req: Request<object, object, SignInBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'Invalid email or password');
    }
    const access_token = await signToken({ sub: user.id, email: user.email });
    res.json({
      success: true,
      data: {
        user: toUserResponse(user),
        access_token,
      },
    });
  } catch (e) {
    next(e);
  }
}
