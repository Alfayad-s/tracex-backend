import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from '../schemas/category.js';
import {
  list,
  getOne,
  create,
  update,
  remove,
  restore,
} from '../controllers/categoriesController.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(list));
router.post('/', validate({ body: createCategorySchema.shape.body }), asyncHandler(create));

router.get(
  '/:id',
  validate({ params: categoryIdParamSchema.shape.params }),
  asyncHandler(getOne)
);
router.patch(
  '/:id',
  validate({
    params: updateCategorySchema.shape.params,
    body: updateCategorySchema.shape.body,
  }),
  asyncHandler(update)
);
router.delete(
  '/:id',
  validate({ params: categoryIdParamSchema.shape.params }),
  asyncHandler(remove)
);
router.post(
  '/:id/restore',
  validate({ params: categoryIdParamSchema.shape.params }),
  asyncHandler(restore)
);

export default router;
