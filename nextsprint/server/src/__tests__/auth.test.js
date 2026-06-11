import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// ─── RED: define the contract for auth endpoints ───────────────────────────

describe('POST /api/auth/register', () => {
  it('creates a user and returns a JWT + public profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.password_hash).toBeUndefined(); // never expose hash
  });

  it('rejects when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@test.com', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('rejects passwords shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/6 characters/i);
  });

  it('rejects duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Charlie', email: 'charlie@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Charlie2', email: 'charlie@test.com', password: 'password456' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('lowercases email before storing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dave', email: 'DAVE@Test.COM', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('dave@test.com');
  });
});

// ─── GREEN: login contract ─────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Eve', email: 'eve@test.com', password: 'correctpass' });
  });

  it('returns a token with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'eve@test.com', password: 'correctpass' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('eve@test.com');
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'eve@test.com', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'anypass' });

    expect(res.status).toBe(401);
  });

  it('rejects missing password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'eve@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('is case-insensitive on email at login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'EVE@TEST.COM', password: 'correctpass' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
