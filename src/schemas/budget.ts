import { z } from 'zod';

const categorySchema = z.string().max(100);
const limitSchema = z.coerce.number().positive('Limit must be greater than 0');
const yearSchema = z.coerce.number().int().min(2000).max(2100);
const monthSchema = z.coerce.number().int().min(0).max(12);

const shareSlugSchema = z.string().max(64, 'Share slug must be at most 64 characters').regex(/^[a-zA-Z0-9_-]*$/, 'Share slug can only contain letters, numbers, underscore, hyphen').optional().nullable();

export const createBudgetSchema = z.object({
  body: z.object({
    category: categorySchema.default(''),
    year: yearSchema,
    month: monthSchema,
    limit: limitSchema,
    shareSlug: shareSlugSchema,
  }),
});

export const updateBudgetSchema = z.object({
  body: z.object({
    category: categorySchema.optional(),
    year: yearSchema.optional(),
    month: monthSchema.optional(),
    limit: limitSchema.optional(),
    shareSlug: shareSlugSchema,
  }),
  params: z.object({
    id: z.string().uuid('Invalid budget id'),
  }),
});

export const budgetIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid budget id'),
  }),
});

export const listBudgetsQuerySchema = z.object({
  query: z.object({
    includeSpending: z.coerce.boolean().optional(),
  }),
});

export type CreateBudgetBody = z.infer<typeof createBudgetSchema>['body'];
export type UpdateBudgetBody = z.infer<typeof updateBudgetSchema>['body'];
export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>['query'];
