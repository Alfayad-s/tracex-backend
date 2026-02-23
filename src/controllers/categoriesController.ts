import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import type { CreateCategoryBody, UpdateCategoryBody } from '../schemas/category.js';

/** Prisma error when table does not exist (migration not run). */
const PRISMA_TABLE_MISSING = 'P2021';

function isTableMissingError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: string }).code === PRISMA_TABLE_MISSING;
}

function toCategoryResponse(c: {
  id: string;
  name: string;
  userId: string | null;
  color: string | null;
  icon: string | null;
  deletedAt?: Date | null;
}) {
  return {
    id: c.id,
    name: c.name,
    userId: c.userId ?? undefined,
    color: c.color ?? undefined,
    icon: c.icon ?? undefined,
    deletedAt: c.deletedAt?.toISOString().slice(0, 10) ?? undefined,
  };
}

/** GET /api/categories — predefined (userId null) + current user's; merge preferences for predefined */
export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
      OR: [{ userId: null }, { userId: req.user.id }],
    },
    orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, userId: true, color: true, icon: true, deletedAt: true },
  });
  const predefinedIds = categories.filter((c) => c.userId === null).map((c) => c.id);
  let preferences: { categoryId: string; color: string | null; icon: string | null }[] = [];
  if (predefinedIds.length > 0) {
    try {
      preferences = await prisma.categoryPreference.findMany({
        where: { userId: req.user.id, categoryId: { in: predefinedIds } },
        select: { categoryId: true, color: true, icon: true },
      });
    } catch (e) {
      if (isTableMissingError(e)) {
        // category_preferences table not created yet (migration not run); return categories without preferences
      } else {
        throw e;
      }
    }
  }
  const prefByCategoryId = Object.fromEntries(preferences.map((p) => [p.categoryId, p]));
  const merged = categories.map((c) => {
    if (c.userId !== null) return toCategoryResponse(c);
    const pref = prefByCategoryId[c.id];
    return toCategoryResponse({
      ...c,
      color: pref?.color ?? c.color,
      icon: pref?.icon ?? c.icon,
    });
  });
  res.json({
    success: true,
    data: merged,
  });
}

/** GET /api/categories/:id — one category; 404 if not found or not allowed; merge preference for predefined */
export async function getOne(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, userId: true, color: true, icon: true, deletedAt: true },
  });
  if (!category || category.deletedAt) throw new AppError(404, 'Category not found');
  if (category.userId !== null && category.userId !== req.user.id) {
    throw new AppError(404, 'Category not found');
  }
  if (category.userId === null) {
    let pref: { color: string | null; icon: string | null } | null = null;
    try {
      pref = await prisma.categoryPreference.findUnique({
        where: { userId_categoryId: { userId: req.user.id, categoryId: id } },
        select: { color: true, icon: true },
      });
    } catch (e) {
      if (isTableMissingError(e)) {
        // table missing; no preference
      } else {
        throw e;
      }
    }
    const merged = {
      ...category,
      color: pref?.color ?? category.color,
      icon: pref?.icon ?? category.icon,
    };
    res.json({ success: true, data: toCategoryResponse(merged) });
    return;
  }
  res.json({
    success: true,
    data: toCategoryResponse(category),
  });
}

/** POST /api/categories — create user category; reject duplicate name per user */
export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const { name, color, icon } = req.body as CreateCategoryBody;
  const existing = await prisma.category.findFirst({
    where: { name, userId: req.user.id, deletedAt: null },
  });
  if (existing) {
    throw new AppError(400, 'You already have a category with this name');
  }
  const category = await prisma.category.create({
    data: {
      name,
      color: color ?? null,
      icon: icon ?? null,
      userId: req.user.id,
    },
    select: { id: true, name: true, userId: true, color: true, icon: true },
  });
  res.status(201).json({
    success: true,
    data: toCategoryResponse(category),
  });
}

/** PATCH /api/categories/:id — update user category (name, color, icon); for predefined, only color/icon via preferences */
export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const body = req.body as UpdateCategoryBody;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, userId: true, name: true, color: true, icon: true },
  });
  if (!category) throw new AppError(404, 'Category not found');

  if (category.userId === null) {
    // Predefined category: only color/icon allowed, stored in CategoryPreference
    if (body.name !== undefined) {
      throw new AppError(400, 'Cannot rename default categories; you can only set color and icon');
    }
    const updates: { color?: string | null; icon?: string | null } = {};
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (Object.keys(updates).length === 0) {
      try {
        const pref = await prisma.categoryPreference.findUnique({
          where: { userId_categoryId: { userId: req.user.id, categoryId: id } },
          select: { color: true, icon: true },
        });
        const merged = {
          ...category,
          color: pref?.color ?? category.color,
          icon: pref?.icon ?? category.icon,
        };
        res.json({ success: true, data: toCategoryResponse(merged) });
        return;
      } catch (e) {
        if (isTableMissingError(e)) {
          throw new AppError(
            503,
            'Category preferences not available; run database migrations (e.g. prisma migrate deploy).'
          );
        }
        throw e;
      }
    }
    try {
      const pref = await prisma.categoryPreference.upsert({
        where: { userId_categoryId: { userId: req.user.id, categoryId: id } },
        create: { userId: req.user.id, categoryId: id, ...updates },
        update: updates,
        select: { color: true, icon: true },
      });
      const merged = {
        ...category,
        color: pref.color ?? category.color,
        icon: pref.icon ?? category.icon,
      };
      res.json({ success: true, data: toCategoryResponse(merged) });
      return;
    } catch (e) {
      if (isTableMissingError(e)) {
        throw new AppError(
          503,
          'Category preferences not available; run database migrations (e.g. prisma migrate deploy).'
        );
      }
      throw e;
    }
  }

  if (category.userId !== req.user.id) {
    throw new AppError(403, 'You can only update your own categories');
  }
  if (body.name !== undefined) {
    const duplicate = await prisma.category.findFirst({
      where: {
        name: body.name,
        userId: req.user.id,
        id: { not: id },
        deletedAt: null,
      },
    });
    if (duplicate) throw new AppError(400, 'You already have a category with this name');
  }
  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.color !== undefined && { color: body.color ?? null }),
      ...(body.icon !== undefined && { icon: body.icon ?? null }),
    },
    select: { id: true, name: true, userId: true, color: true, icon: true, deletedAt: true },
  });
  res.json({
    success: true,
    data: toCategoryResponse(updated),
  });
}

/** DELETE /api/categories/:id — soft-delete user category only */
export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!category) throw new AppError(404, 'Category not found');
  if (category.userId !== req.user.id) {
    throw new AppError(403, 'You can only delete your own categories');
  }
  await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  res.status(204).send();
}

/** POST /api/categories/:id/restore — restore soft-deleted user category */
export async function restore(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const category = await prisma.category.findUnique({
    where: { id },
    select: { userId: true, deletedAt: true },
  });
  if (!category) throw new AppError(404, 'Category not found');
  if (category.userId !== req.user.id) {
    throw new AppError(403, 'You can only restore your own categories');
  }
  if (!category.deletedAt) {
    throw new AppError(400, 'Category is not deleted');
  }
  const restored = await prisma.category.update({
    where: { id },
    data: { deletedAt: null },
    select: { id: true, name: true, userId: true, color: true, icon: true, deletedAt: true },
  });
  res.json({ success: true, data: toCategoryResponse(restored) });
}
