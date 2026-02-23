import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getPublicBySlug } from '../controllers/budgetsController.js';

const router = Router();
router.get('/budgets/:slug', asyncHandler(getPublicBySlug));

export default router;
