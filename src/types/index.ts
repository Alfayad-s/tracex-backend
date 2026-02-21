import type { Expense } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string | null;
};

export type ExpenseCreateInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: never;
  createdAt?: never;
  updatedAt?: never;
};

export type ExpenseUpdateInput = Partial<
  Pick<Expense, 'date' | 'amount' | 'category' | 'description' | 'userId'>
>;

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
