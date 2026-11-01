import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../src/services/authService.js';

describe('Auth Service & Routes', () => {
  const app = createApp();
  const testEmail = `tester_${Date.now()}@example.com`;
  const testUsername = `testuser_${Date.now()}`;
  const testPassword = 'StrongPassword123!';

  it('correctly hashes and verifies passwords', () => {
    const { salt, hash } = hashPassword('MySecretPass');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
    expect(verifyPassword('MySecretPass', salt, hash)).toBe(true);
    expect(verifyPassword('WrongPass', salt, hash)).toBe(false);
  });

  it('generates and verifies valid session tokens', () => {
    const mockUser = { id: 'usr_123', email: 'a@b.com', username: 'ab' };
    const token = generateToken(mockUser);
    expect(token).toBeDefined();

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.id).toBe('usr_123');
    expect(decoded.email).toBe('a@b.com');
  });

  it('registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Developer',
        email: testEmail,
        username: testUsername,
        password: testPassword
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects duplicate registration with same email or username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Developer',
        email: testEmail,
        username: testUsername,
        password: testPassword
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in an existing user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        loginIdentifier: testEmail,
        password: testPassword
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.username).toBe(testUsername);
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        loginIdentifier: testEmail,
        password: 'IncorrectPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('inspects session token with /api/auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        loginIdentifier: testUsername,
        password: testPassword
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testEmail);
  });

  it('returns database connection status', async () => {
    const res = await request(app).get('/api/auth/db-status');
    expect(res.status).toBe(200);
    expect(res.body.data.databaseType).toBeDefined();
  });
});
