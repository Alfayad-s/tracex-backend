import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLoggerMiddleware } from './middleware/requestLogger.js';
import { errorMiddleware } from './middleware/error.js';
import routes from './routes/index.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests; try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use(routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorMiddleware);

export { app };
