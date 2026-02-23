import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const amountSchema = z.coerce.number().positive('Amount must be greater than 0');
const categorySchema = z.string().min(1, 'Category is required').max(100);
const descriptionSchema = z.string().max(5000).optional();
const frequencySchema = z.enum(['day', 'week', 'month'], {
  errorMap: () => ({ message: 'Frequency must be day, week, or month' }),
});

export const createRecurringSchema = z.object({
  body: z.object({
    category: categorySchema,
    amount: amountSchema,
    description: descriptionSchema,
    frequency: frequencySchema,
    startDate: dateSchema,
  }),
});

export const updateRecurringSchema = z.object({
  body: z.object({
    category: categorySchema.optional(),
    amount: amountSchema.optional(),
    description: descriptionSchema,
    frequency: frequencySchema.optional(),
    startDate: dateSchema.optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid recurring expense id'),
  }),
});

export const recurringIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid recurring expense id'),
  }),
});

export type CreateRecurringBody = z.infer<typeof createRecurringSchema>['body'];
export type UpdateRecurringBody = z.infer<typeof updateRecurringSchema>['body'];
