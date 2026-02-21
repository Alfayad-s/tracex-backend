import { Router } from 'express';
import { me, signUp, signIn } from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { signUpSchema, signInSchema } from '../schemas/auth.js';

const router: Router = Router();

router.get('/me', requireAuth, me);
router.post('/signup', validate({ body: signUpSchema.shape.body }), signUp);
router.post('/signin', validate({ body: signInSchema.shape.body }), signIn);

export default router;
