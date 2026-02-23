import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { signUpSchema, signInSchema, updateProfileSchema, changePasswordSchema } from '../schemas/auth.js';
import { signUp, signIn, me, updateProfile, changePassword } from '../controllers/authController.js';

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
  asyncHandler(signUp)
);

router.post(
  '/signin',
  validate({ body: signInSchema.shape.body }),
  asyncHandler(signIn)
);

router.get('/me', requireAuth, asyncHandler(me));
router.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema.shape.body }),
  asyncHandler(updateProfile)
);
router.post(
  '/change-password',
  requireAuth,
  validate({ body: changePasswordSchema.shape.body }),
  asyncHandler(changePassword)
);

export default router;
