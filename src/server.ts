import 'dotenv/config';
import { app } from './app.js';
import { logger } from './utils/logger.js';
import { connectDb, disconnectDb } from './config/db.js';
import { validateEnv, env } from './config/env.js';

async function start(): Promise<void> {
  validateEnv();
  await connectDb();
  const server = app.listen(env.port, () => {
    logger.info(`Server listening on http://localhost:${env.port}`);
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

start().catch((e) => {
  logger.fatal({ err: e }, 'Startup failed');
  process.exit(1);
});
