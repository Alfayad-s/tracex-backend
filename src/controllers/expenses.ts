import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import type {
  CreateExpenseBody,
  UpdateExpenseBody,
  ListExpensesQuery,
  SummaryQuery,
  BulkCreateExpenseBody,
} from '../schemas/expense.js';
import {
  listExpensesQuerySchema,
  summaryQuerySchema,
  exportQuerySchema,
} from '../schemas/expense.js';
import { toExpenseResponse } from '../utils/serialize.js';
import { isAllowedCategory } from '../utils/categories.js';

function expenseWhere(userId: string): Prisma.ExpenseWhereInput {
  return { userId, deletedAt: null };
}

export async function listExpenses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = listExpensesQuerySchema.safeParse(req.query);
    const q: ListExpensesQuery = parsed.success ? parsed.data : listExpensesQuerySchema.parse({});

    const where: Prisma.ExpenseWhereInput = { ...expenseWhere(userId) };
    if (q.from ?? q.to) {
      where.date = {};
      if (q.from) where.date.gte = q.from;
      if (q.to) where.date.lte = q.to;
    }
    if (q.category) where.category = q.category;
    if (q.minAmount !== undefined || q.maxAmount !== undefined) {
      where.amount = {};
      if (q.minAmount !== undefined) where.amount.gte = q.minAmount;
      if (q.maxAmount !== undefined) where.amount.lte = q.maxAmount;
    }
    if (q.search?.trim()) {
      where.description = { contains: q.search.trim(), mode: 'insensitive' };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { [q.sort]: q.order },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      success: true,
      data: expenses.map(toExpenseResponse),
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit),
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function getExpenseById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, ...expenseWhere(userId) },
    });
    if (!expense) {
      throw new AppError(404, 'Expense not found');
    }
    res.json({ success: true, data: toExpenseResponse(expense) });
  } catch (e) {
    next(e);
  }
}

export async function createExpense(
  req: Request<object, object, CreateExpenseBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date, amount, category, description } = req.body;
    const allowed = await isAllowedCategory(userId, category);
    if (!allowed) {
      throw new AppError(
        400,
        'Invalid category. Use a predefined category or create one under GET /api/categories.'
      );
    }
    const expense = await prisma.expense.create({
      data: {
        date,
        amount,
        category,
        description: description ?? null,
        userId,
      },
    });
    res.status(201).json({ success: true, data: toExpenseResponse(expense) });
  } catch (e) {
    next(e);
  }
}

export async function updateExpense(
  req: Request<{ id: string }, object, UpdateExpenseBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { date, amount, category, description } = req.body;
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, ...expenseWhere(userId) },
    });
    if (!existing) {
      throw new AppError(404, 'Expense not found');
    }
    if (category !== undefined) {
      const allowed = await isAllowedCategory(userId, category);
      if (!allowed) {
        throw new AppError(
          400,
          'Invalid category. Use a predefined category or create one under GET /api/categories.'
        );
      }
    }
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        ...(date !== undefined && { date }),
        ...(amount !== undefined && { amount }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
      },
    });
    res.json({ success: true, data: toExpenseResponse(expense) });
  } catch (e) {
    next(e);
  }
}

export async function deleteExpense(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, ...expenseWhere(userId) },
    });
    if (!existing) {
      throw new AppError(404, 'Expense not found');
    }
    await prisma.expense.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function restoreExpense(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!existing) {
      throw new AppError(404, 'Expense not found');
    }
    if (existing.deletedAt == null) {
      throw new AppError(400, 'Expense is not deleted');
    }
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
    });
    res.json({ success: true, data: toExpenseResponse(expense) });
  } catch (e) {
    next(e);
  }
}

function getPeriodKey(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const d = new Date(date);
  if (groupBy === 'day') {
    return d.toISOString().slice(0, 10);
  }
  if (groupBy === 'week') {
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    return d.toISOString().slice(0, 10);
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getSummary(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = summaryQuerySchema.safeParse(req.query);
    const q: SummaryQuery = parsed.success ? parsed.data : {};

    const where: Prisma.ExpenseWhereInput = { ...expenseWhere(userId) };
    if (q.from ?? q.to) {
      where.date = {};
      if (q.from) where.date.gte = q.from;
      if (q.to) where.date.lte = q.to;
    }

    const [agg, byPeriod] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      q.groupBy
        ? prisma.expense.groupBy({
            where,
            by: ['date'],
            _sum: { amount: true },
            _count: true,
          })
        : Promise.resolve([]),
    ]);

    const total = Number(agg._sum.amount ?? 0);
    const count = agg._count;

    const data: {
      total: number;
      count: number;
      byPeriod?: { period: string; total: number; count: number }[];
    } = { total, count };

    if (q.groupBy && byPeriod.length > 0) {
      const map = new Map<string, { total: number; count: number }>();
      for (const row of byPeriod) {
        const period = getPeriodKey(row.date, q.groupBy);
        const existing = map.get(period) ?? { total: 0, count: 0 };
        existing.total += Number(row._sum.amount ?? 0);
        existing.count += row._count;
        map.set(period, existing);
      }
      data.byPeriod = [...map.entries()]
        .map(([period, v]) => ({ period, total: v.total, count: v.count }))
        .sort((a, b) => a.period.localeCompare(b.period));
    }

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getSummaryByCategory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = summaryQuerySchema.safeParse(req.query);
    const q: SummaryQuery = parsed.success ? parsed.data : {};

    const where: Prisma.ExpenseWhereInput = { ...expenseWhere(userId) };
    if (q.from ?? q.to) {
      where.date = {};
      if (q.from) where.date.gte = q.from;
      if (q.to) where.date.lte = q.to;
    }

    const [agg, byCategory] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.groupBy({
        where,
        by: ['category'],
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const total = Number(agg._sum.amount ?? 0);
    const count = agg._count;

    res.json({
      success: true,
      data: {
        total,
        count,
        byCategory: byCategory.map((row) => ({
          category: row.category,
          total: Number(row._sum.amount ?? 0),
          count: row._count,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportExpenses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const parsed = exportQuerySchema.safeParse(req.query);
    const q = parsed.success ? parsed.data : exportQuerySchema.parse({});

    const where: Prisma.ExpenseWhereInput = { ...expenseWhere(userId) };
    if (q.from ?? q.to) {
      where.date = {};
      if (q.from) where.date.gte = q.from;
      if (q.to) where.date.lte = q.to;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const headers = ['date', 'amount', 'category', 'description'];
    const rows = expenses.map((e) => [
      e.date.toISOString().slice(0, 10),
      Number(e.amount),
      escapeCsvField(e.category),
      e.description ? escapeCsvField(e.description) : '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expenses-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csv);
  } catch (e) {
    next(e);
  }
}

export async function bulkCreateExpenses(
  req: Request<object, object, BulkCreateExpenseBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { expenses: items } = req.body;
    const { getAllowedCategoryNames } = await import('../utils/categories.js');
    const allowed = await getAllowedCategoryNames(userId);
    for (const item of items) {
      if (!allowed.has(item.category)) {
        throw new AppError(
          400,
          `Invalid category "${item.category}" at index ${items.indexOf(item)}. Use a predefined or user category.`
        );
      }
    }
    const created = await prisma.$transaction(
      items.map((item) =>
        prisma.expense.create({
          data: {
            date: item.date,
            amount: item.amount,
            category: item.category,
            description: item.description ?? null,
            userId,
          },
        })
      )
    );
    res.status(201).json({
      success: true,
      data: created.map(toExpenseResponse),
      count: created.length,
    });
  } catch (e) {
    next(e);
  }
}
