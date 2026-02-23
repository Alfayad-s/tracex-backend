import { z } from 'zod';

export const signUpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const signInSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().max(255, 'Name must be at most 255 characters').optional().nullable(),
    currency: z.string().max(10).optional().nullable(),
    webhookUrl: z.string().max(500, 'Webhook URL must be at most 500 characters').optional().nullable(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export type SignUpBody = z.infer<typeof signUpSchema>['body'];
export type SignInBody = z.infer<typeof signInSchema>['body'];
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>['body'];
export type ChangePasswordBody = z.infer<typeof changePasswordSchema>['body'];
