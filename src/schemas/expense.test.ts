import { describe, it, expect } from 'vitest';
import {
  listExpensesQuerySchema,
  createExpenseSchema,
  updateExpenseSchema,
  summaryQuerySchema,
  exportQuerySchema,
  bulkCreateExpenseSchema,
} from './expense.js';

describe('listExpensesQuerySchema', () => {
  it('defaults page=1, limit=20, sort=date, order=desc', () => {
    const r = listExpensesQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.page).toBe(1);
      expect(r.data.limit).toBe(20);
      expect(r.data.sort).toBe('date');
      expect(r.data.order).toBe('desc');
    }
  });

  it('accepts valid query params', () => {
    const r = listExpensesQuerySchema.safeParse({
      page: 2,
      limit: 10,
      from: '2025-01-01',
      to: '2025-01-31',
      sort: 'amount',
      order: 'asc',
    });
    expect(r.success).toBe(true);
  });

  it('rejects limit > 100', () => {
    const r = listExpensesQuerySchema.safeParse({ limit: 101 });
    expect(r.success).toBe(false);
  });
});

describe('createExpenseSchema', () => {
  it('accepts valid body', () => {
    const r = createExpenseSchema.safeParse({
      body: {
        date: '2025-02-21',
        amount: 10.5,
        category: 'Food',
        description: 'Lunch',
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects negative amount', () => {
    const r = createExpenseSchema.safeParse({
      body: { date: '2025-02-21', amount: -1, category: 'Food' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects empty category', () => {
    const r = createExpenseSchema.safeParse({
      body: { date: '2025-02-21', amount: 10, category: '' },
    });
    expect(r.success).toBe(false);
  });
});

describe('updateExpenseSchema', () => {
  it('accepts partial body', () => {
    const r = updateExpenseSchema.safeParse({
      body: { amount: 20 },
    });
    expect(r.success).toBe(true);
  });
});

describe('summaryQuerySchema', () => {
  it('accepts groupBy day|week|month', () => {
    expect(summaryQuerySchema.safeParse({ groupBy: 'day' }).success).toBe(true);
    expect(summaryQuerySchema.safeParse({ groupBy: 'month' }).success).toBe(true);
    expect(summaryQuerySchema.safeParse({ groupBy: 'invalid' }).success).toBe(false);
  });
});

describe('exportQuerySchema', () => {
  it('defaults format to csv', () => {
    const r = exportQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.format).toBe('csv');
  });
});

describe('bulkCreateExpenseSchema', () => {
  it('accepts array of 1-100 expenses', () => {
    const r = bulkCreateExpenseSchema.safeParse({
      body: {
        expenses: [
          { date: '2025-02-21', amount: 10, category: 'Food' },
        ],
      },
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty expenses array', () => {
    const r = bulkCreateExpenseSchema.safeParse({
      body: { expenses: [] },
    });
    expect(r.success).toBe(false);
  });

  it('rejects more than 100 expenses', () => {
    const r = bulkCreateExpenseSchema.safeParse({
      body: {
        expenses: Array(101).fill({ date: '2025-02-21', amount: 1, category: 'Food' }),
      },
    });
    expect(r.success).toBe(false);
  });
});
