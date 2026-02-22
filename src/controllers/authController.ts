import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import { signToken } from '../utils/jwt.js';
import type { SignUpBody, SignInBody } from '../schemas/auth.js';

function toUserResponse(user: { id: string; email: string; name: string | null }) {
  return { id: user.id, email: user.email, name: user.name ?? undefined };
}

export async function signUp(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as SignUpBody;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(400, 'Email already registered');
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, name: true },
  });
  const token = await signToken({ sub: user.id, email: user.email });
  res.status(201).json({
    success: true,
    user: toUserResponse(user),
    token,
  });
}

export async function signIn(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as SignInBody;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, 'Invalid email or password');
  }
  const token = await signToken({ sub: user.id, email: user.email });
  res.json({
    success: true,
    user: toUserResponse({ id: user.id, email: user.email, name: user.name }),
    token,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated');
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  res.json({
    success: true,
    user: toUserResponse(user),
  });
}
