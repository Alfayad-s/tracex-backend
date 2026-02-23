import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import type {
  CreateExpenseBody,
  UpdateExpenseBody,
  ListExpensesQuery,
  BulkExpensesBody,
  BulkUpdateExpensesBody,
  BulkDeleteExpensesBody,
  SummaryQuery,
  SummaryByCategoryQuery,
  ExportQuery,
} from '../schemas/expense.js';

export async function ensureCategoryExists(categoryName: string, userId: string): Promise<void> {
  const exists = await prisma.category.findFirst({
    where: {
      deletedAt: null,
      name: categoryName,
      OR: [{ userId: null }, { userId }],
    },
  });
  if (!exists) {
    throw new AppError(400, `Category "${categoryName}" does not exist or is not available`);
  }
}

async function resolveCategoryForExpense(
  userId: string,
  categoryName?: string,
  categoryId?: string | null
): Promise<string> {
  if (categoryId) {
    const cat = await prisma.category.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
        OR: [{ userId: null }, { userId }],
      },
      select: { name: true },
    });
    if (!cat) throw new AppError(400, `Category id "${categoryId}" does not exist or is not available`);
    return cat.name;
  }
  if (categoryName) {
    await ensureCategoryExists(categoryName, userId);
    return categoryName;
  }
  throw new AppError(400, 'Category or categoryId is required');
}

function toExpenseResponse(e: {
  id: string;
  date: Date;
  amount: Prisma.Decimal;
  category: string;
  categoryId: string | null;
  description: string | null;
  receiptUrl: string | null;
  currency: string | null;
  userId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: e.id,
    date: e.date.toISOString().slice(0, 10),
    amount: Number(e.amount),
    category: e.category,
    categoryId: e.categoryId ?? undefined,
    description: e.description ?? undefined,
    receiptUrl: e.receiptUrl ?? undefined,
    currency: e.currency ?? undefined,
    userId: e.userId,
    deletedAt: e.deletedAt?.toISOString().slice(0, 10) ?? undefined,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

const expenseSelect = {
  id: true,
  date: true,
  amount: true,
  category: true,
  categoryId: true,
  description: true,
  receiptUrl: true,
  currency: true,
  userId: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** GET /api/expenses */
export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const q = req.query as unknown as ListExpensesQuery;
  const where: Prisma.ExpenseWhereInput = {
    userId: req.user.id,
    deletedAt: null,
  };
  if (q.from) where.date = { ...(where.date as object), gte: new Date(q.from) };
  if (q.to) where.date = { ...(where.date as object), lte: new Date(q.to) };
  if (q.category) where.category = q.category;
  if (q.minAmount !== undefined) where.amount = { ...(where.amount as object), gte: q.minAmount };
  if (q.maxAmount !== undefined) where.amount = { ...(where.amount as object), lte: q.maxAmount };
  if (q.search?.trim()) {
    where.description = { contains: q.search.trim(), mode: 'insensitive' as const };
  }
  const orderBy: Prisma.ExpenseOrderByWithRelationInput =
    q.sort === 'amount'
      ? { amount: q.order }
      : q.sort === 'category'
        ? { category: q.order }
        : q.sort === 'createdAt'
          ? { createdAt: q.order }
          : { date: q.order };
  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.limit,
      take: q.limit,
      select: expenseSelect,
    }),
    prisma.expense.count({ where }),
  ]);
  const totalPages = Math.ceil(total / q.limit) || 1;
  res.json({
    success: true,
    data: items.map(toExpenseResponse),
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages,
      hasNext: q.page < totalPages,
      hasPrev: q.page > 1,
    },
  });
}

/** GET /api/expenses/:id */
export async function getOne(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const expense = await prisma.expense.findUnique({
    where: { id },
    select: expenseSelect,
  });
  if (!expense || expense.userId !== req.user.id) {
    throw new AppError(404, 'Expense not found');
  }
  res.json({ success: true, data: toExpenseResponse(expense) });
}

/** POST /api/expenses */
export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const body = req.body as CreateExpenseBody;
  const categoryName = await resolveCategoryForExpense(req.user.id, body.category, body.categoryId);
  const expense = await prisma.expense.create({
    data: {
      date: new Date(body.date),
      amount: body.amount,
      category: categoryName,
      categoryId: body.categoryId ?? null,
      description: body.description ?? null,
      receiptUrl: body.receiptUrl ?? null,
      currency: body.currency ?? null,
      userId: req.user.id,
    },
    select: expenseSelect,
  });
  res.status(201).json({ success: true, data: toExpenseResponse(expense) });
}

/** PATCH /api/expenses/:id */
export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const body = req.body as UpdateExpenseBody;
  const expense = await prisma.expense.findUnique({
    where: { id },
    select: expenseSelect,
  });
  if (!expense || expense.userId !== req.user.id) {
    throw new AppError(404, 'Expense not found');
  }
  const data: Prisma.ExpenseUpdateInput = {};
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.receiptUrl !== undefined) data.receiptUrl = body.receiptUrl ?? null;
  if (body.currency !== undefined) data.currency = body.currency ?? null;
  if (body.category !== undefined || body.categoryId !== undefined) {
    const categoryName = await resolveCategoryForExpense(
      req.user.id,
      body.category,
      body.categoryId
    );
    data.category = categoryName;
    data.categoryRef = body.categoryId ? { connect: { id: body.categoryId } } : { disconnect: true };
  }
  const updated = await prisma.expense.update({
    where: { id },
    data,
    select: expenseSelect,
  });
  res.json({ success: true, data: toExpenseResponse(updated) });
}

/** DELETE /api/expenses/:id — soft delete */
export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const expense = await prisma.expense.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!expense || expense.userId !== req.user.id) {
    throw new AppError(404, 'Expense not found');
  }
  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  res.status(204).send();
}

/** POST /api/expenses/:id/restore */
export async function restore(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const expense = await prisma.expense.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!expense || expense.userId !== req.user.id) {
    throw new AppError(404, 'Expense not found');
  }
  const updated = await prisma.expense.update({
    where: { id },
    data: { deletedAt: null },
    select: expenseSelect,
  });
  res.json({ success: true, data: toExpenseResponse(updated) });
}

/** POST /api/expenses/bulk */
export async function bulk(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const { expenses: items } = req.body as BulkExpensesBody;
  const data = await Promise.all(
    items.map(async (item) => {
      const categoryName = await resolveCategoryForExpense(
        req.user!.id,
        item.category,
        item.categoryId
      );
      return {
        date: new Date(item.date),
        amount: item.amount,
        category: categoryName,
        categoryId: item.categoryId ?? null,
        description: item.description ?? null,
        receiptUrl: item.receiptUrl ?? null,
        currency: item.currency ?? null,
        userId: req.user!.id,
      };
    })
  );
  const created = await prisma.expense.createManyAndReturn({
    data,
    select: expenseSelect,
  });
  res.status(201).json({
    success: true,
    data: created.map(toExpenseResponse),
    count: created.length,
  });
}

/** PATCH /api/expenses/bulk — partial update of multiple expenses by id */
export async function bulkUpdate(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const body = req.body as BulkUpdateExpensesBody;
  const expenses = await prisma.expense.findMany({
    where: { id: { in: body.ids }, userId: req.user.id },
    select: { id: true },
  });
  const idSet = new Set(expenses.map((e) => e.id));
  const missing = body.ids.filter((id) => !idSet.has(id));
  if (missing.length > 0) {
    throw new AppError(404, `Expense(s) not found: ${missing.join(', ')}`);
  }
  const data: Prisma.ExpenseUpdateInput = {};
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.amount !== undefined) data.amount = body.amount;
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.receiptUrl !== undefined) data.receiptUrl = body.receiptUrl ?? null;
  if (body.currency !== undefined) data.currency = body.currency ?? null;
  if (body.category !== undefined || body.categoryId !== undefined) {
    const categoryName = await resolveCategoryForExpense(
      req.user.id,
      body.category,
      body.categoryId
    );
    data.category = categoryName;
    data.categoryRef = body.categoryId ? { connect: { id: body.categoryId } } : { disconnect: true };
  }
  if (Object.keys(data).length === 0) {
    const updated = await prisma.expense.findMany({
      where: { id: { in: body.ids }, userId: req.user.id },
      select: expenseSelect,
    });
    res.json({ success: true, data: updated.map(toExpenseResponse), count: updated.length });
    return;
  }
  await prisma.expense.updateMany({
    where: { id: { in: body.ids }, userId: req.user.id },
    data,
  });
  const updated = await prisma.expense.findMany({
    where: { id: { in: body.ids }, userId: req.user.id },
    select: expenseSelect,
  });
  res.json({ success: true, data: updated.map(toExpenseResponse), count: updated.length });
}

/** DELETE /api/expenses/bulk — soft-delete multiple expenses by id */
export async function bulkDelete(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const body = req.body as BulkDeleteExpensesBody;
  const result = await prisma.expense.updateMany({
    where: { id: { in: body.ids }, userId: req.user.id },
    data: { deletedAt: new Date() },
  });
  res.json({ success: true, deleted: result.count });
}

/** GET /api/expenses/summary */
export async function summary(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const q = req.query as unknown as SummaryQuery;
  const where: Prisma.ExpenseWhereInput = {
    userId: req.user.id,
    deletedAt: null,
  };
  if (q.from) where.date = { ...(where.date as object), gte: new Date(q.from) };
  if (q.to) where.date = { ...(where.date as object), lte: new Date(q.to) };
  const agg = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  });
  const total = Number(agg._sum.amount ?? 0);
  const count = agg._count;
  if (!q.groupBy) {
    res.json({ success: true, data: { total, count } });
    return;
  }
  const periodLiteral = q.groupBy === 'day' ? 'day' : q.groupBy === 'week' ? 'week' : 'month';
  type Row = { period: Date; total: string; count: bigint };
  const byPeriod = await prisma.$queryRaw<Row[]>`
    SELECT date_trunc(${periodLiteral}::text, e.date)::date AS period,
           SUM(e.amount)::decimal AS total,
           COUNT(*)::bigint AS count
    FROM expenses e
    WHERE e.user_id = ${req.user!.id} AND e.deleted_at IS NULL
      ${q.from ? Prisma.sql`AND e.date >= ${new Date(q.from)}::date` : Prisma.empty}
      ${q.to ? Prisma.sql`AND e.date <= ${new Date(q.to)}::date` : Prisma.empty}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  res.json({
    success: true,
    data: {
      total,
      count,
      byPeriod: byPeriod.map((r) => ({
        period: (r.period as Date).toISOString().slice(0, 10),
        total: Number(r.total),
        count: Number(r.count),
      })),
    },
  });
}

/** GET /api/expenses/summary/by-category */
export async function summaryByCategory(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const q = req.query as unknown as SummaryByCategoryQuery;
  const where: Prisma.ExpenseWhereInput = {
    userId: req.user.id,
    deletedAt: null,
  };
  if (q.from) where.date = { ...(where.date as object), gte: new Date(q.from) };
  if (q.to) where.date = { ...(where.date as object), lte: new Date(q.to) };
  const grouped = await prisma.expense.groupBy({
    by: ['category'],
    where,
    _sum: { amount: true },
    _count: true,
  });
  const total = grouped.reduce((s, g) => s + Number(g._sum.amount ?? 0), 0);
  const count = grouped.reduce((s, g) => s + g._count, 0);
  res.json({
    success: true,
    data: {
      total,
      count,
      byCategory: grouped.map((g) => ({
        category: g.category,
        total: Number(g._sum.amount ?? 0),
        count: g._count,
      })),
    },
  });
}

/** GET /api/expenses/export */
export async function exportCsv(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const q = req.query as unknown as ExportQuery;
  const where: Prisma.ExpenseWhereInput = {
    userId: req.user.id,
    deletedAt: null,
  };
  if (q.from) where.date = { ...(where.date as object), gte: new Date(q.from) };
  if (q.to) where.date = { ...(where.date as object), lte: new Date(q.to) };
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'asc' },
    select: { date: true, amount: true, category: true, description: true },
  });
  const header = 'date,amount,category,description';
  const escape = (s: string) => (s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s);
  const rows = expenses.map(
    (e) =>
      `${e.date.toISOString().slice(0, 10)},${Number(e.amount)},${escape(e.category)},${e.description ? escape(e.description) : ''}`
  );
  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
  res.type('text/csv').send(csv);
}
