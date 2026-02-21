import { z } from 'zod';

const sortFields = ['date', 'amount', 'createdAt'] as const;
const orderValues = ['asc', 'desc'] as const;

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.string().max(100).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  search: z.string().max(500).optional(),
  sort: z.enum(sortFields).default('date'),
  order: z.enum(orderValues).default('desc'),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export const createExpenseSchema = z.object({
  body: z.object({
    date: z.coerce.date(),
    amount: z.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required').max(100),
    description: z.string().max(5000).optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    date: z.coerce.date().optional(),
    amount: z.number().positive('Amount must be positive').optional(),
    category: z.string().min(1).max(100).optional(),
    description: z.string().max(5000).optional().nullable(),
  }),
});

export type CreateExpenseBody = z.infer<typeof createExpenseSchema>['body'];
export type UpdateExpenseBody = z.infer<typeof updateExpenseSchema>['body'];

export const summaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;

export const exportQuerySchema = z.object({
  format: z.enum(['csv']).default('csv'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type ExportQuery = z.infer<typeof exportQuerySchema>;

const singleExpenseSchema = z.object({
  date: z.coerce.date(),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().max(5000).optional(),
});

export const bulkCreateExpenseSchema = z.object({
  body: z.object({
    expenses: z.array(singleExpenseSchema).min(1).max(100),
  }),
});

export type BulkCreateExpenseBody = z.infer<typeof bulkCreateExpenseSchema>['body'];
