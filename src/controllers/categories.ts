import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import type { CreateCategoryBody, UpdateCategoryBody } from '../schemas/category.js';

export async function listCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const categories = await prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, data: categories });
  } catch (e) {
    next(e);
  }
}

export async function getCategoryById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const category = await prisma.category.findFirst({
      where: {
        id: req.params.id,
        OR: [{ userId: null }, { userId }],
      },
    });
    if (!category) {
      throw new AppError(404, 'Category not found');
    }
    res.json({ success: true, data: category });
  } catch (e) {
    next(e);
  }
}

export async function createCategory(
  req: Request<object, object, CreateCategoryBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, color, icon } = req.body;
    const existing = await prisma.category.findFirst({
      where: { name, userId },
    });
    if (existing) {
      throw new AppError(400, 'You already have a category with this name');
    }
    const predefined = await prisma.category.findFirst({
      where: { name, userId: null },
    });
    if (predefined) {
      throw new AppError(400, 'This name is reserved for a predefined category');
    }
    const category = await prisma.category.create({
      data: { name, userId, color: color ?? null, icon: icon ?? null },
    });
    res.status(201).json({ success: true, data: category });
  } catch (e) {
    next(e);
  }
}

export async function updateCategory(
  req: Request<{ id: string }, object, UpdateCategoryBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) {
      throw new AppError(404, 'Category not found or you cannot edit predefined categories');
    }
    const { name, color, icon } = req.body;
    if (name !== undefined && name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: { name, userId },
      });
      if (duplicate) {
        throw new AppError(400, 'You already have a category with this name');
      }
    }
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
      },
    });
    res.json({ success: true, data: category });
  } catch (e) {
    next(e);
  }
}

export async function deleteCategory(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) {
      throw new AppError(404, 'Category not found or you cannot delete predefined categories');
    }
    await prisma.category.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
