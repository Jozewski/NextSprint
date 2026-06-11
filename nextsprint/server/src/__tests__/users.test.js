import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Profile User', email: 'profile@test.com', password: 'password123' });
  token = res.body.token;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/users/me', () => {
  it('returns the authenticated user profile', async () => {
    const res = await request(app).get('/api/users/me').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('profile@test.com');
    expect(res.body.user.name).toBe('Profile User');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('rejects an expired/invalid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set({ Authorization: 'Bearer not-a-real-token' });
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/users/me', () => {
  it('updates name and github', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(auth())
      .send({ name: 'Updated Name', github: 'https://github.com/updated' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
    expect(res.body.user.github).toBe('https://github.com/updated');
  });

  it('updates resumeStatus to in-progress', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(auth())
      .send({ resumeStatus: 'in-progress' });

    expect(res.status).toBe(200);
    expect(res.body.user.resumeStatus).toBe('in-progress');
  });

  it('rejects an invalid resumeStatus', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(auth())
      .send({ resumeStatus: 'maybe' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/resumeStatus/i);
  });

  it('updates currentModule', async () => {
    const res = await request(app)
      .put('/api/users/me')
      .set(auth())
      .send({ currentModule: 7 });

    expect(res.status).toBe(200);
    expect(res.body.user.currentModule).toBe(7);
  });
});
