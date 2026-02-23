import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../middleware/error.js';
import { ensureCategoryExists } from './expensesController.js';
import type { CreateRecurringBody, UpdateRecurringBody } from '../schemas/recurring.js';

function addPeriod(date: Date, frequency: string): Date {
  const d = new Date(date);
  if (frequency === 'day') d.setDate(d.getDate() + 1);
  else if (frequency === 'week') d.setDate(d.getDate() + 7);
  else if (frequency === 'month') d.setMonth(d.getMonth() + 1);
  return d;
}

function toRecurringResponse(r: {
  id: string;
  userId: string;
  category: string;
  amount: Prisma.Decimal;
  description: string | null;
  frequency: string;
  startDate: Date;
  nextRunAt: Date;
  lastRunAt: Date | null;
}) {
  return {
    id: r.id,
    userId: r.userId,
    category: r.category,
    amount: Number(r.amount),
    description: r.description ?? undefined,
    frequency: r.frequency,
    startDate: r.startDate.toISOString().slice(0, 10),
    nextRunAt: r.nextRunAt.toISOString().slice(0, 10),
    lastRunAt: r.lastRunAt?.toISOString().slice(0, 10) ?? undefined,
  };
}

/** GET /api/recurring */
export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const items = await prisma.recurringExpense.findMany({
    where: { userId: req.user.id },
    orderBy: { nextRunAt: 'asc' },
  });
  res.json({ success: true, data: items.map(toRecurringResponse) });
}

/** GET /api/recurring/:id */
export async function getOne(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const item = await prisma.recurringExpense.findUnique({ where: { id } });
  if (!item || item.userId !== req.user.id) {
    throw new AppError(404, 'Recurring expense not found');
  }
  res.json({ success: true, data: toRecurringResponse(item) });
}

/** POST /api/recurring */
export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const body = req.body as CreateRecurringBody;
  await ensureCategoryExists(body.category, req.user.id);
  const startDate = new Date(body.startDate);
  const item = await prisma.recurringExpense.create({
    data: {
      userId: req.user.id,
      category: body.category,
      amount: body.amount,
      description: body.description ?? null,
      frequency: body.frequency,
      startDate,
      nextRunAt: startDate,
    },
  });
  res.status(201).json({ success: true, data: toRecurringResponse(item) });
}

/** PATCH /api/recurring/:id */
export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const body = req.body as UpdateRecurringBody;
  const item = await prisma.recurringExpense.findUnique({ where: { id } });
  if (!item || item.userId !== req.user.id) {
    throw new AppError(404, 'Recurring expense not found');
  }
  if (body.category !== undefined) {
    await ensureCategoryExists(body.category, req.user.id);
  }
  const updated = await prisma.recurringExpense.update({
    where: { id },
    data: {
      ...(body.category !== undefined && { category: body.category }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.description !== undefined && { description: body.description ?? null }),
      ...(body.frequency !== undefined && { frequency: body.frequency }),
      ...(body.startDate !== undefined && {
        startDate: new Date(body.startDate),
        nextRunAt: new Date(body.startDate),
      }),
    },
  });
  res.json({ success: true, data: toRecurringResponse(updated) });
}

/** DELETE /api/recurring/:id */
export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const id = req.params.id as string;
  const item = await prisma.recurringExpense.findUnique({ where: { id } });
  if (!item || item.userId !== req.user.id) {
    throw new AppError(404, 'Recurring expense not found');
  }
  await prisma.recurringExpense.delete({ where: { id } });
  res.status(204).send();
}

/** POST /api/recurring/run — create expenses from due recurring items (call from cron or manually) */
export async function run(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'Not authenticated');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const due = await prisma.recurringExpense.findMany({
    where: {
      userId: req.user.id,
      nextRunAt: { lte: endOfToday },
    },
  });
  const created: { id: string; date: string; amount: number; category: string }[] = [];
  for (const r of due) {
    const runDate = new Date(r.nextRunAt);
    runDate.setHours(0, 0, 0, 0);
    await prisma.expense.create({
      data: {
        userId: r.userId,
        date: runDate,
        amount: r.amount,
        category: r.category,
        description: r.description,
      },
    });
    const nextRun = addPeriod(runDate, r.frequency);
    await prisma.recurringExpense.update({
      where: { id: r.id },
      data: { nextRunAt: nextRun, lastRunAt: runDate },
    });
    created.push({
      id: r.id,
      date: runDate.toISOString().slice(0, 10),
      amount: Number(r.amount),
      category: r.category,
    });
  }
  if (created.length > 0) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { webhookUrl: true },
    });
    if (user?.webhookUrl?.trim()) {
      try {
        await fetch(user.webhookUrl.trim(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'recurring_run',
            processed: created.length,
            created,
          }),
        });
      } catch {
        // Fire-and-forget; do not fail the request
      }
    }
  }
  res.json({
    success: true,
    data: { processed: created.length, created },
  });
}
