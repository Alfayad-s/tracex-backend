import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  budgetIdParamSchema,
  listBudgetsQuerySchema,
} from '../schemas/budget.js';
import {
  list,
  getOne,
  create,
  update,
  remove,
  compare,
} from '../controllers/budgetsController.js';

const router = Router();
router.use(requireAuth);

router.get('/', validate({ query: listBudgetsQuerySchema.shape.query }), asyncHandler(list));
router.post('/', validate({ body: createBudgetSchema.shape.body }), asyncHandler(create));

router.get(
  '/:id/compare',
  validate({ params: budgetIdParamSchema.shape.params }),
  asyncHandler(compare)
);

router.get(
  '/:id',
  validate({ params: budgetIdParamSchema.shape.params }),
  asyncHandler(getOne)
);
router.patch(
  '/:id',
  validate({
    params: updateBudgetSchema.shape.params,
    body: updateBudgetSchema.shape.body,
  }),
  asyncHandler(update)
);
router.delete(
  '/:id',
  validate({ params: budgetIdParamSchema.shape.params }),
  asyncHandler(remove)
);

export default router;
