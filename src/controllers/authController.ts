import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import { signToken } from '../utils/jwt.js';
import type { SignUpBody, SignInBody, UpdateProfileBody, ChangePasswordBody } from '../schemas/auth.js';

function toUserResponse(user: {
  id: string;
  email: string;
  name: string | null;
  currency?: string | null;
  webhookUrl?: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    currency: user.currency ?? undefined,
    webhookUrl: user.webhookUrl ?? undefined,
  };
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
    select: { id: true, email: true, name: true, currency: true, webhookUrl: true },
  });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  res.json({
    success: true,
    user: toUserResponse(user),
  });
}

/** PATCH /api/auth/me — update profile (name); require auth */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const body = req.body as UpdateProfileBody;
  const updates: { name?: string | null; currency?: string | null; webhookUrl?: string | null } = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.currency !== undefined) updates.currency = body.currency;
  if (body.webhookUrl !== undefined) updates.webhookUrl = body.webhookUrl;
  if (Object.keys(updates).length === 0) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, currency: true, webhookUrl: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, user: toUserResponse(user) });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updates,
    select: { id: true, email: true, name: true, currency: true, webhookUrl: true },
  });
  res.json({ success: true, user: toUserResponse(user) });
}

/** POST /api/auth/change-password — require auth; currentPassword + newPassword */
export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const { currentPassword, newPassword } = req.body as ChangePasswordBody;
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    throw new AppError(401, 'Current password is incorrect');
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash },
  });
  res.status(204).send();
}
