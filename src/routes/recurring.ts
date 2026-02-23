import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createRecurringSchema,
  updateRecurringSchema,
  recurringIdParamSchema,
} from '../schemas/recurring.js';
import {
  list,
  getOne,
  create,
  update,
  remove,
  run,
} from '../controllers/recurringController.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(list));
router.post('/', validate({ body: createRecurringSchema.shape.body }), asyncHandler(create));

router.post('/run', asyncHandler(run));

router.get(
  '/:id',
  validate({ params: recurringIdParamSchema.shape.params }),
  asyncHandler(getOne)
);
router.patch(
  '/:id',
  validate({
    params: updateRecurringSchema.shape.params,
    body: updateRecurringSchema.shape.body,
  }),
  asyncHandler(update)
);
router.delete(
  '/:id',
  validate({ params: recurringIdParamSchema.shape.params }),
  asyncHandler(remove)
);

export default router;
