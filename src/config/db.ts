import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

export const prisma = new PrismaClient();

export async function connectDb(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (e) {
    logger.error({ err: e }, 'Database connection failed');
    throw e;
  }
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
