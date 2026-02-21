import type { Expense } from '@prisma/client';

export type ExpenseResponse = Omit<Expense, 'amount'> & { amount: number };

export function toExpenseResponse(expense: Expense): ExpenseResponse {
  return {
    ...expense,
    amount: Number(expense.amount),
  };
}
