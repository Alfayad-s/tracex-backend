import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import type { CreateBudgetBody, UpdateBudgetBody } from '../schemas/budget.js';

const BUDGET_ALL_CATEGORIES = '';

function toBudgetResponse(b: {
  id: string;
  userId: string;
  category: string;
  year: number;
  month: number;
  limit: Prisma.Decimal;
  shareSlug?: string | null;
}) {
  return {
    id: b.id,
    userId: b.userId,
    category: b.category === BUDGET_ALL_CATEGORIES ? undefined : b.category,
    year: b.year,
    month: b.month === 0 ? undefined : b.month,
    limit: Number(b.limit),
    shareSlug: b.shareSlug ?? undefined,
  };
}

/** GET /api/budgets — optional includeSpending to attach spending vs limit per budget */
export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const q = req.query as { includeSpending?: string };
  const includeSpending = q.includeSpending === 'true' || q.includeSpending === '1';
  const budgets = await prisma.budget.findMany({
    where: { userId: req.user.id },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { category: 'asc' }],
  });
  if (!includeSpending) {
    res.json({
      success: true,
      data: budgets.map((b) => toBudgetResponse({ ...b, category: b.category })),
    });
    return;
  }
  const data = await Promise.all(
    budgets.map(async (b) => {
      const from = new Date(b.year, b.month === 0 ? 0 : b.month - 1, 1);
      const to =
        b.month === 0
          ? new Date(b.year, 11, 31)
          : new Date(b.year, b.month, 0);
      const where: Prisma.ExpenseWhereInput = {
        userId: req.user!.id,
        deletedAt: null,
        date: { gte: from, lte: to },
      };
      if (b.category !== BUDGET_ALL_CATEGORIES) {
        where.category = b.category;
      }
      const agg = await prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      });
      const spending = Number(agg._sum.amount ?? 0);
      const limit = Number(b.limit);
      return {
        ...toBudgetResponse({ ...b, category: b.category }),
        spending,
        limit,
        remaining: limit - spending,
        percentUsed: limit > 0 ? Math.round((spending / limit) * 100) : 0,
        expenseCount: agg._count,
      };
    })
  );
  res.json({ success: true, data });
}

/** GET /api/budgets/:id */
export async function getOne(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== req.user.id) {
    throw new AppError(404, 'Budget not found');
  }
  res.json({ success: true, data: toBudgetResponse(budget) });
}

/** POST /api/budgets */
export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const body = req.body as CreateBudgetBody;
  const category = (body.category ?? '').trim() || BUDGET_ALL_CATEGORIES;
  const month = body.month ?? 0;
  const existing = await prisma.budget.findUnique({
    where: {
      userId_category_year_month: {
        userId: req.user.id,
        category,
        year: body.year,
        month,
      },
    },
  });
  if (existing) {
    throw new AppError(400, 'Budget already exists for this category and period');
  }
  const budget = await prisma.budget.create({
    data: {
      userId: req.user.id,
      category,
      year: body.year,
      month,
      limit: body.limit,
      shareSlug: (body as { shareSlug?: string | null }).shareSlug ?? null,
    },
  });
  res.status(201).json({ success: true, data: toBudgetResponse(budget) });
}

/** PATCH /api/budgets/:id */
export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const body = req.body as UpdateBudgetBody;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== req.user.id) {
    throw new AppError(404, 'Budget not found');
  }
  const updated = await prisma.budget.update({
    where: { id },
    data: {
      ...(body.category !== undefined && { category: (body.category ?? '').trim() || BUDGET_ALL_CATEGORIES }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.month !== undefined && { month: body.month }),
      ...(body.limit !== undefined && { limit: body.limit }),
      ...((body as { shareSlug?: string | null }).shareSlug !== undefined && {
        shareSlug: (body as { shareSlug?: string | null }).shareSlug ?? null,
      }),
    },
  });
  res.json({ success: true, data: toBudgetResponse(updated) });
}

/** DELETE /api/budgets/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== req.user.id) {
    throw new AppError(404, 'Budget not found');
  }
  await prisma.budget.delete({ where: { id } });
  res.status(204).send();
}

/** GET /api/budgets/:id/compare — spending vs limit */
export async function compare(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget || budget.userId !== req.user.id) {
    throw new AppError(404, 'Budget not found');
  }
  const from = new Date(budget.year, budget.month === 0 ? 0 : budget.month - 1, 1);
  const to = budget.month === 0
    ? new Date(budget.year, 11, 31)
    : new Date(budget.year, budget.month, 0);
  const where: Prisma.ExpenseWhereInput = {
    userId: req.user.id,
    deletedAt: null,
    date: { gte: from, lte: to },
  };
  if (budget.category !== BUDGET_ALL_CATEGORIES) {
    where.category = budget.category;
  }
  const agg = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  });
  const spending = Number(agg._sum.amount ?? 0);
  const limit = Number(budget.limit);
  res.json({
    success: true,
    data: {
      budget: toBudgetResponse(budget),
      spending,
      limit,
      remaining: limit - spending,
      percentUsed: limit > 0 ? Math.round((spending / limit) * 100) : 0,
      expenseCount: agg._count,
    },
  });
}

/** GET /api/public/budgets/:slug — read-only budget + spending (no auth); slug from shareSlug */
export async function getPublicBySlug(req: Request, res: Response): Promise<void> {
  const slug = req.params.slug as string;
  const budget = await prisma.budget.findUnique({
    where: { shareSlug: slug },
  });
  if (!budget || !budget.shareSlug) {
    throw new AppError(404, 'Budget not found');
  }
  const from = new Date(budget.year, budget.month === 0 ? 0 : budget.month - 1, 1);
  const to =
    budget.month === 0 ? new Date(budget.year, 11, 31) : new Date(budget.year, budget.month, 0);
  const where: Prisma.ExpenseWhereInput = {
    userId: budget.userId,
    deletedAt: null,
    date: { gte: from, lte: to },
  };
  if (budget.category !== BUDGET_ALL_CATEGORIES) {
    where.category = budget.category;
  }
  const agg = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  });
  const spending = Number(agg._sum.amount ?? 0);
  const limit = Number(budget.limit);
  res.json({
    success: true,
    data: {
      budget: toBudgetResponse(budget),
      spending,
      limit,
      remaining: limit - spending,
      percentUsed: limit > 0 ? Math.round((spending / limit) * 100) : 0,
      expenseCount: agg._count,
    },
  });
}
