import { Router } from 'express';
import { getHealth } from './health.js';

const router = Router();
router.get('/health', getHealth);
export default router;
