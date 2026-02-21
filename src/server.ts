import 'dotenv/config';
import { app } from './app.js';
import { logger } from './utils/logger.js';

if (!process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET is not set in .env — signup/signin and protected routes will fail. Add it (see .env.example).');
}

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
