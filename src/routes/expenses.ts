import { Router } from 'express';
import {
  listExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  restoreExpense,
  getSummary,
  getSummaryByCategory,
  exportExpenses,
  bulkCreateExpenses,
} from '../controllers/expenses.js';
import { validate } from '../middleware/validate.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  bulkCreateExpenseSchema,
} from '../schemas/expense.js';

const router: Router = Router();

router.get('/', listExpenses);
router.get('/summary/by-category', getSummaryByCategory);
router.get('/summary', getSummary);
router.get('/export', exportExpenses);
router.get('/:id', getExpenseById);
router.post('/', validate({ body: createExpenseSchema.shape.body }), createExpense);
router.post('/bulk', validate({ body: bulkCreateExpenseSchema.shape.body }), bulkCreateExpenses);
router.patch('/:id', validate({ body: updateExpenseSchema.shape.body }), updateExpense);
router.post('/:id/restore', restoreExpense);
router.delete('/:id', deleteExpense);

export default router;
