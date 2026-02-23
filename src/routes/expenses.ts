import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
  bulkExpensesSchema,
  bulkUpdateExpensesSchema,
  bulkDeleteExpensesSchema,
  summaryQuerySchema,
  summaryByCategoryQuerySchema,
  exportQuerySchema,
} from '../schemas/expense.js';
import {
  list,
  getOne,
  create,
  update,
  remove,
  restore,
  bulk,
  bulkUpdate,
  bulkDelete,
  summary,
  summaryByCategory,
  exportCsv,
} from '../controllers/expensesController.js';

const router = Router();
router.use(requireAuth);

router.get('/', validate({ query: listExpensesQuerySchema.shape.query }), asyncHandler(list));
router.post('/', validate({ body: createExpenseSchema.shape.body }), asyncHandler(create));

router.post(
  '/bulk',
  validate({ body: bulkExpensesSchema.shape.body }),
  asyncHandler(bulk)
);
router.patch(
  '/bulk',
  validate({ body: bulkUpdateExpensesSchema.shape.body }),
  asyncHandler(bulkUpdate)
);
router.delete(
  '/bulk',
  validate({ body: bulkDeleteExpensesSchema.shape.body }),
  asyncHandler(bulkDelete)
);

router.get(
  '/summary',
  validate({ query: summaryQuerySchema.shape.query }),
  asyncHandler(summary)
);
router.get(
  '/summary/by-category',
  validate({ query: summaryByCategoryQuerySchema.shape.query }),
  asyncHandler(summaryByCategory)
);

router.get(
  '/export',
  validate({ query: exportQuerySchema.shape.query }),
  asyncHandler(exportCsv)
);

router.get(
  '/:id',
  validate({ params: expenseIdParamSchema.shape.params }),
  asyncHandler(getOne)
);
router.patch(
  '/:id',
  validate({
    params: updateExpenseSchema.shape.params,
    body: updateExpenseSchema.shape.body,
  }),
  asyncHandler(update)
);
router.delete(
  '/:id',
  validate({ params: expenseIdParamSchema.shape.params }),
  asyncHandler(remove)
);
router.post(
  '/:id/restore',
  validate({ params: expenseIdParamSchema.shape.params }),
  asyncHandler(restore)
);

export default router;
