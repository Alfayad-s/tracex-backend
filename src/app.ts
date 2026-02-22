import express from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorMiddleware } from './middleware/error.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';

const app = express();

const corsOrigin = process.env.CORS_ORIGIN ?? '*';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(requestIdMiddleware);

app.use((req, _res, next) => {
  logger.info({ requestId: req.requestId, method: req.method, path: req.path }, 'request');
  next();
});

app.use(routes);

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorMiddleware);

export { app };
