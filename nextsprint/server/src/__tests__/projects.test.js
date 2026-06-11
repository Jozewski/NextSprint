import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let token;
let otherToken;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Proj User', email: 'projuser@test.com', password: 'password123' });
  token = res.body.token;

  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Other User', email: 'other@test.com', password: 'password123' });
  otherToken = res2.body.token;
});

const auth = () => ({ Authorization: `Bearer ${token}` });
const otherAuth = () => ({ Authorization: `Bearer ${otherToken}` });

// ─── RED ──────────────────────────────────────────────────────────────────

describe('GET /api/projects', () => {
  it('returns empty array for a brand-new user', async () => {
    const res = await request(app).get('/api/projects').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.projects).toEqual([]);
  });

  it('blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/projects', () => {
  it('creates a project and returns it with taskCount 0', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(auth())
      .send({ title: 'My Project', description: 'A test project' });

    expect(res.status).toBe(201);
    expect(res.body.project.title).toBe('My Project');
    expect(res.body.project.description).toBe('A test project');
    expect(res.body.project.taskCount).toBe(0);
    expect(res.body.project.id).toBeDefined();
  });

  it('defaults description to empty string when omitted', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(auth())
      .send({ title: 'No Desc' });

    expect(res.status).toBe(201);
    expect(res.body.project.description).toBe('');
  });

  it('rejects blank title with 400', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(auth())
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('shows created projects in GET list', async () => {
    await request(app).post('/api/projects').set(auth()).send({ title: 'Listed Project' });
    const res = await request(app).get('/api/projects').set(auth());
    const titles = res.body.projects.map((p) => p.title);
    expect(titles).toContain('Listed Project');
  });
});

describe('PUT /api/projects/:id', () => {
  let projectId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(auth())
      .send({ title: 'Update Me', description: 'Original' });
    projectId = res.body.project.id;
  });

  it('updates title and description', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(auth())
      .send({ title: 'Updated', description: 'Changed' });

    expect(res.status).toBe(200);
    expect(res.body.project.title).toBe('Updated');
    expect(res.body.project.description).toBe('Changed');
  });

  it('returns 404 when another user tries to update', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(otherAuth())
      .send({ title: 'Stolen' });

    expect(res.status).toBe(404);
  });

  it('rejects blank title on update', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(auth())
      .send({ title: '' });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes an owned project and returns ok:true', async () => {
    const createRes = await request(app)
      .post('/api/projects')
      .set(auth())
      .send({ title: 'Delete Me' });
    const id = createRes.body.project.id;

    const res = await request(app).delete(`/api/projects/${id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 404 on double-delete', async () => {
    const createRes = await request(app)
      .post('/api/projects')
      .set(auth())
      .send({ title: 'Gone' });
    const id = createRes.body.project.id;

    await request(app).delete(`/api/projects/${id}`).set(auth());
    const res = await request(app).delete(`/api/projects/${id}`).set(auth());
    expect(res.status).toBe(404);
  });

  it('returns 404 when another user tries to delete', async () => {
    const createRes = await request(app)
      .post('/api/projects')
      .set(auth())
      .send({ title: 'Guarded' });
    const id = createRes.body.project.id;

    const res = await request(app).delete(`/api/projects/${id}`).set(otherAuth());
    expect(res.status).toBe(404);
  });
});
