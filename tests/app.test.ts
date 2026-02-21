import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Request ID', () => {
  it('returns x-request-id in response', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('echoes provided X-Request-ID when sent', async () => {
    const id = 'custom-id-123';
    const res = await request(app).get('/health').set('X-Request-ID', id);
    expect(res.headers['x-request-id']).toBe(id);
  });
});

describe('Health', () => {
  it('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.timestamp).toBeDefined();
  });
});

describe('API versioning', () => {
  it('GET /api/v1/expenses without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/expenses');
    expect(res.status).toBe(401);
  });

  it('GET /api/expenses without auth returns 401 (backward compat)', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });
});
