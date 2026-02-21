import rateLimit from 'express-rate-limit';

const windowMs = 15 * 60 * 1000; // 15 minutes

export const apiLimiter = rateLimit({
  windowMs,
  max: 200,
  message: { success: false, error: 'Too many requests; try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs,
  max: 20,
  message: { success: false, error: 'Too many auth attempts; try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
