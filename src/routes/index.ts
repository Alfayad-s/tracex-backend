import { Router } from 'express';
import { getHealth } from './health.js';
import authRoutes from './auth.js';
import categoriesRoutes from './categories.js';
import expensesRoutes from './expenses.js';
import budgetsRoutes from './budgets.js';
import recurringRoutes from './recurring.js';
import publicRoutes from './public.js';
import { apiDocsRouter } from './apiDocs.js';

const router = Router();
router.get('/health', getHealth);

router.use(apiDocsRouter);

router.use('/api/v1/public', publicRoutes);

const apiRouters = [authRoutes, categoriesRoutes, expensesRoutes, budgetsRoutes, recurringRoutes];
router.use('/api/v1/auth', apiRouters[0]);
router.use('/api/v1/categories', apiRouters[1]);
router.use('/api/v1/expenses', apiRouters[2]);
router.use('/api/v1/budgets', apiRouters[3]);
router.use('/api/v1/recurring', apiRouters[4]);
router.use('/api/auth', apiRouters[0]);
router.use('/api/categories', apiRouters[1]);
router.use('/api/expenses', apiRouters[2]);
router.use('/api/budgets', apiRouters[3]);
router.use('/api/recurring', apiRouters[4]);

export default router;
