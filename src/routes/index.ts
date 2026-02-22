import { Router } from 'express';
import { getHealth } from './health.js';
import authRoutes from './auth.js';

const router = Router();
router.get('/health', getHealth);

router.use('/api/auth', authRoutes);

export default router;
