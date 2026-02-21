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

export type SignUpBody = z.infer<typeof signUpSchema>['body'];
export type SignInBody = z.infer<typeof signInSchema>['body'];
