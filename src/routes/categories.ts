import { Router } from 'express';
import {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories.js';
import { validate } from '../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.js';

const router: Router = Router();

router.get('/', listCategories);
router.get('/:id', getCategoryById);
router.post('/', validate({ body: createCategorySchema.shape.body }), createCategory);
router.patch('/:id', validate({ body: updateCategorySchema.shape.body }), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
