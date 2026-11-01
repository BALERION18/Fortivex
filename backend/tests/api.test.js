import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API Routes', () => {
  const app = createApp();

  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('fortivex-backend');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('POST /api/parse-url parses valid github url', async () => {
    const res = await request(app)
      .post('/api/parse-url')
      .send({ url: 'https://github.com/facebook/react' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.owner).toBe('facebook');
    expect(res.body.data.repo).toBe('react');
  });

  it('POST /api/parse-url rejects invalid input with 400', async () => {
    const res = await request(app)
      .post('/api/parse-url')
      .send({ url: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/repo/:owner/:repo rejects invalid characters with 400', async () => {
    const res = await request(app).get('/api/repo/invalid@user/test-repo');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/nonexistent returns 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
