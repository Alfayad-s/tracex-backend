import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { signUpSchema, signInSchema } from '../schemas/auth.js';
import { signUp, signIn, me } from '../controllers/authController.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many attempts; try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.use(authLimiter);

router.post(
  '/signup',
  validate({ body: signUpSchema.shape.body }),
  signUp
);

router.post(
  '/signin',
  validate({ body: signInSchema.shape.body }),
  signIn
);

router.get('/me', requireAuth, me);

export default router;
