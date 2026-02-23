import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { connectDb, disconnectDb } from '../../src/config/db.js';
import { app } from '../../src/app.js';

const hasDb = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);

describe('integration: app', () => {
  beforeAll(async () => {
    if (hasDb) {
      try {
        await connectDb();
      } catch {
        // skip DB tests if connection fails
      }
    }
  });

  afterAll(async () => {
    if (hasDb) await disconnectDb();
  });

  describe('GET /health', () => {
    it('returns 200 and status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok' });
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ success: false, error: expect.any(String) });
    });
  });

  describe('auth flow (signup, signin, me)', () => {
    it.skipIf(!hasDb)('signup returns 201 and token', async () => {
      const email = `test-${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email, password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toMatchObject({ email });
      expect(res.body.token).toBeDefined();
    });

    it.skipIf(!hasDb)('signin returns 200 and token', async () => {
      const email = `signin-${Date.now()}@example.com`;
      await request(app).post('/api/v1/auth/signup').send({ email, password: 'password123' });
      const res = await request(app)
        .post('/api/v1/auth/signin')
        .send({ email, password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${res.body.token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe(email);
    });
  });

  describe('expense CRUD (requires DB + seeded categories)', () => {
    it.skipIf(!hasDb)('create and list expense', async () => {
      const email = `expense-${Date.now()}@example.com`;
      const signUpRes = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email, password: 'password123' });
      expect(signUpRes.status).toBe(201);
      const token = signUpRes.body.token;
      const createRes = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2025-02-21',
          amount: 15.5,
          category: 'Food',
          description: 'Test expense',
        });
      expect(createRes.status).toBe(201);
      expect(createRes.body.data).toMatchObject({
        date: '2025-02-21',
        amount: 15.5,
        category: 'Food',
        description: 'Test expense',
      });
      const listRes = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body.data.some((e: { description?: string }) => e.description === 'Test expense')).toBe(true);
    });
  });

  describe('404', () => {
    it('returns 404 and error for unknown path', async () => {
      const res = await request(app).get('/api/v1/unknown');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, error: 'Not found' });
    });
  });
});
