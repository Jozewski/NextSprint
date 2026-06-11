import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let token;
let projectId;

beforeAll(async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Task User', email: 'taskuser@test.com', password: 'password123' });
  token = regRes.body.token;

  const projRes = await request(app)
    .post('/api/projects')
    .set({ Authorization: `Bearer ${token}` })
    .send({ title: 'Task Project' });
  projectId = projRes.body.project.id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

// ─── RED ──────────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  it('returns empty array for a new user', async () => {
    const res = await request(app).get('/api/tasks').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
  });

  it('blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task with sensible defaults', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'My Task' });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('My Task');
    expect(res.body.task.status).toBe('backlog');
    expect(res.body.task.priority).toBe('medium');
    expect(res.body.task.category).toBe('coursework');
    expect(res.body.task.completedAt).toBeNull();
  });

  it('creates a task linked to a project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Project Task', projectId });

    expect(res.status).toBe(201);
    expect(res.body.task.projectId).toBe(projectId);
  });

  it('stamps completedAt when status is complete at creation', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Done Already', status: 'complete' });

    expect(res.status).toBe(201);
    expect(res.body.task.completedAt).not.toBeNull();
  });

  it('rejects blank title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('rejects invalid status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Bad', status: 'flying' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/status/i);
  });

  it('rejects invalid priority', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Bad', priority: 'urgent' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/priority/i);
  });

  it('rejects invalid category', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Bad', category: 'hobby' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/category/i);
  });

  it('rejects a projectId that belongs to another user', async () => {
    const other = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@test.com', password: 'password123' });
    const otherProjRes = await request(app)
      .post('/api/projects')
      .set({ Authorization: `Bearer ${other.body.token}` })
      .send({ title: "Other's Project" });

    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Sneaky', projectId: otherProjRes.body.project.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/project not found/i);
  });

  it('filters tasks by projectId query param', async () => {
    await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Filtered Task', projectId });

    const res = await request(app)
      .get(`/api/tasks?projectId=${projectId}`)
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.tasks.every((t) => t.projectId === projectId)).toBe(true);
  });

  it('filters tasks by status query param', async () => {
    await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'In Progress Task', status: 'in-progress' });

    const res = await request(app)
      .get('/api/tasks?status=in-progress')
      .set(auth());

    expect(res.status).toBe(200);
    expect(res.body.tasks.every((t) => t.status === 'in-progress')).toBe(true);
  });
});

// ─── Kanban drag (status update) ─────────────────────────────────────────

describe('PUT /api/tasks/:id — kanban moves', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Drag Task', status: 'todo' });
    taskId = res.body.task.id;
  });

  it('moves task to in-progress', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(auth())
      .send({ status: 'in-progress' });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('in-progress');
  });

  it('stamps completedAt when moving to complete', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(auth())
      .send({ status: 'complete' });

    expect(res.status).toBe(200);
    expect(res.body.task.completedAt).not.toBeNull();
  });

  it('clears completedAt when moving back from complete', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(auth())
      .send({ status: 'review' });

    expect(res.status).toBe(200);
    expect(res.body.task.completedAt).toBeNull();
  });

  it('returns 404 for a task owned by another user', async () => {
    const other = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Y', email: 'y@test.com', password: 'password123' });

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set({ Authorization: `Bearer ${other.body.token}` })
      .send({ status: 'complete' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and returns ok:true', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Delete Me' });
    const id = createRes.body.task.id;

    const res = await request(app).delete(`/api/tasks/${id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 404 on double-delete', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ title: 'Gone Task' });
    const id = createRes.body.task.id;

    await request(app).delete(`/api/tasks/${id}`).set(auth());
    const res = await request(app).delete(`/api/tasks/${id}`).set(auth());
    expect(res.status).toBe(404);
  });
});
