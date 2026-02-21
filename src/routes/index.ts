import { Router } from 'express';
import authRouter from './auth.js';
import categoriesRouter from './categories.js';
import expensesRouter from './expenses.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router: Router = Router();

router.use('/auth', authLimiter, authRouter);
router.use('/categories', requireAuth, categoriesRouter);
router.use('/expenses', requireAuth, expensesRouter);

export default router;
