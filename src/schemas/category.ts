import { z } from 'zod';

const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters');
const colorSchema = z.string().max(20, 'Color must be at most 20 characters').optional().nullable();
const iconSchema = z.string().max(50, 'Icon must be at most 50 characters').optional().nullable();

export const createCategorySchema = z.object({
  body: z.object({
    name: nameSchema,
    color: colorSchema,
    icon: iconSchema,
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: nameSchema.optional(),
    color: colorSchema,
    icon: iconSchema,
  }),
  params: z.object({
    id: z.string().uuid('Invalid category id'),
  }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category id'),
  }),
});

export type CreateCategoryBody = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>['body'];
