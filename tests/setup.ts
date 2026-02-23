import 'dotenv/config';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-at-least-32-characters-long';
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? '';
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL ?? '';
}
