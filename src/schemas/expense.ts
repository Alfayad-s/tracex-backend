import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const amountSchema = z.coerce.number().positive('Amount must be greater than 0');
const categorySchema = z.string().min(1, 'Category is required').max(100, 'Category must be at most 100 characters');
const descriptionSchema = z.string().max(5000, 'Description must be at most 5000 characters').optional();
const categoryIdSchema = z.string().uuid('Invalid category id').optional();
const receiptUrlSchema = z.string().max(500, 'Receipt URL must be at most 500 characters').optional().nullable();
const currencySchema = z.string().max(10, 'Currency must be at most 10 characters').optional().nullable();

export const createExpenseSchema = z.object({
  body: z.object({
    date: dateSchema,
    amount: amountSchema,
    category: categorySchema.optional(),
    categoryId: categoryIdSchema,
    description: descriptionSchema,
    receiptUrl: receiptUrlSchema,
    currency: currencySchema,
  }).refine((b) => b.category ?? b.categoryId, { message: 'Category or categoryId is required' }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    date: dateSchema.optional(),
    amount: amountSchema.optional(),
    category: categorySchema.optional(),
    categoryId: categoryIdSchema,
    description: descriptionSchema,
    receiptUrl: receiptUrlSchema,
    currency: currencySchema,
  }),
  params: z.object({
    id: z.string().uuid('Invalid expense id'),
  }),
});

export const expenseIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid expense id'),
  }),
});

export const listExpensesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    category: z.string().max(100).optional(),
    minAmount: z.coerce.number().min(0).optional(),
    maxAmount: z.coerce.number().min(0).optional(),
    search: z.string().max(200).optional(),
    sort: z.enum(['date', 'amount', 'category', 'createdAt']).default('date'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const bulkExpenseItemSchema = z.object({
  date: dateSchema,
  amount: amountSchema,
  category: categorySchema.optional(),
  categoryId: categoryIdSchema,
  description: descriptionSchema,
  receiptUrl: receiptUrlSchema,
  currency: currencySchema,
}).refine((b) => b.category ?? b.categoryId, { message: 'Category or categoryId is required' });

export const bulkExpensesSchema = z.object({
  body: z.object({
    expenses: z.array(bulkExpenseItemSchema).min(1, 'At least one expense required').max(100, 'Maximum 100 expenses per request'),
  }),
});

export const summaryQuerySchema = z.object({
  query: z.object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional(),
  }),
});

export const summaryByCategoryQuerySchema = z.object({
  query: z.object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  }),
});

export const exportQuerySchema = z.object({
  query: z.object({
    format: z.literal('csv'),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  }),
});

export const bulkUpdateExpensesSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one id required').max(100, 'Maximum 100 ids'),
    date: dateSchema.optional(),
    amount: amountSchema.optional(),
    category: categorySchema.optional(),
    categoryId: categoryIdSchema,
    description: descriptionSchema,
    receiptUrl: receiptUrlSchema,
    currency: currencySchema,
  }),
});

export const bulkDeleteExpensesSchema = z.object({
  body: z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one id required').max(100, 'Maximum 100 ids'),
  }),
});

export type CreateExpenseBody = z.infer<typeof createExpenseSchema>['body'];
export type UpdateExpenseBody = z.infer<typeof updateExpenseSchema>['body'];
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>['query'];
export type BulkExpensesBody = z.infer<typeof bulkExpensesSchema>['body'];
export type BulkUpdateExpensesBody = z.infer<typeof bulkUpdateExpensesSchema>['body'];
export type BulkDeleteExpensesBody = z.infer<typeof bulkDeleteExpensesSchema>['body'];
export type SummaryQuery = z.infer<typeof summaryQuerySchema>['query'];
export type SummaryByCategoryQuery = z.infer<typeof summaryByCategoryQuerySchema>['query'];
export type ExportQuery = z.infer<typeof exportQuerySchema>['query'];
