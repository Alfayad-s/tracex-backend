import 'dotenv/config';
import { app } from './app.js';
import { logger } from './utils/logger.js';
import { connectDb, disconnectDb } from './config/db.js';
import { validateEnv, env } from './config/env.js';

function start(): void {
  const port = env.port;
  const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`Server listening on http://0.0.0.0:${port}`);
    try {
      validateEnv();
    } catch (e) {
      logger.error(
        { err: e },
        'Startup: missing or invalid env (DATABASE_URL, DIRECT_URL, JWT_SECRET 32+ chars). Set in Railway and redeploy. API will fail until fixed.'
      );
    }
    connectDb().catch((e) => {
      logger.error({ err: e }, 'Database connection failed');
    });
  });

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down');
    server.close(() => {
      disconnectDb()
        .then(() => process.exit(0))
        .catch((e) => {
          logger.error({ err: e }, 'Disconnect failed');
          process.exit(1);
        });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

try {
  start();
} catch (e) {
  logger.fatal({ err: e }, 'Startup failed');
  process.exit(1);
}
