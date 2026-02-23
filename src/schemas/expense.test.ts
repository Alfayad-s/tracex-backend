import { describe, it, expect } from 'vitest';
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  bulkExpensesSchema,
  exportQuerySchema,
} from './expense.js';

describe('expense schemas', () => {
  describe('createExpenseSchema', () => {
    it('accepts valid create body', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2025-02-21',
          amount: 10.5,
          category: 'Food',
          description: 'Lunch',
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid date format', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '21-02-2025',
          amount: 10,
          category: 'Food',
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-positive amount', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2025-02-21',
          amount: 0,
          category: 'Food',
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty category', () => {
      const result = createExpenseSchema.safeParse({
        body: {
          date: '2025-02-21',
          amount: 10,
          category: '',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('listExpensesQuerySchema', () => {
    it('applies defaults for page and limit', () => {
      const result = listExpensesQuerySchema.safeParse({ query: {} });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe(1);
        expect(result.data.query.limit).toBe(20);
        expect(result.data.query.sort).toBe('date');
        expect(result.data.query.order).toBe('desc');
      }
    });

    it('accepts valid query params', () => {
      const result = listExpensesQuerySchema.safeParse({
        query: {
          page: 2,
          limit: 10,
          from: '2025-02-01',
          to: '2025-02-28',
          sort: 'amount',
          order: 'asc',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('bulkExpensesSchema', () => {
    it('accepts 1–100 expenses', () => {
      const result = bulkExpensesSchema.safeParse({
        body: {
          expenses: [
            { date: '2025-02-21', amount: 5, category: 'Food' },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty expenses array', () => {
      const result = bulkExpensesSchema.safeParse({
        body: { expenses: [] },
      });
      expect(result.success).toBe(false);
    });

    it('rejects over 100 expenses', () => {
      const result = bulkExpensesSchema.safeParse({
        body: {
          expenses: Array(101).fill({
            date: '2025-02-21',
            amount: 1,
            category: 'Food',
          }),
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('exportQuerySchema', () => {
    it('requires format=csv', () => {
      const result = exportQuerySchema.safeParse({
        query: { format: 'csv' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects other format', () => {
      const result = exportQuerySchema.safeParse({
        query: { format: 'json' },
      });
      expect(result.success).toBe(false);
    });
  });
});
