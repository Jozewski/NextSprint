import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Stats User', email: 'stats@test.com', password: 'password123' });
  token = res.body.token;

  const headers = { Authorization: `Bearer ${token}` };
  const today = new Date().toISOString().slice(0, 10);

  // Seed tasks that drive every stat counter
  await request(app).post('/api/tasks').set(headers).send({ title: 'T1 complete', status: 'complete' });
  await request(app).post('/api/tasks').set(headers).send({ title: 'T2 complete', status: 'complete' });
  await request(app).post('/api/tasks').set(headers).send({ title: 'T3 remaining', status: 'todo' });
  await request(app).post('/api/tasks').set(headers).send({ title: 'T4 due today', status: 'in-progress', dueDate: today });
  await request(app).post('/api/tasks').set(headers).send({ title: 'T5 due today done', status: 'complete', dueDate: today });

  await request(app).post('/api/projects').set(headers).send({ title: 'Active Project 1' });
  await request(app).post('/api/projects').set(headers).send({ title: 'Active Project 2' });
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('GET /api/stats', () => {
  it('blocks unauthenticated requests', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
  });

  it('returns the correct tasksCompleted count', async () => {
    const res = await request(app).get('/api/stats').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.tasksCompleted).toBe(3); // T1, T2, T5
  });

  it('returns the correct tasksRemaining count', async () => {
    const res = await request(app).get('/api/stats').set(auth());
    expect(res.body.tasksRemaining).toBe(2); // T3, T4
  });

  it('returns tasksDueToday excluding completed tasks', async () => {
    const res = await request(app).get('/api/stats').set(auth());
    expect(res.body.tasksDueToday).toBe(1); // only T4 (T5 is complete)
  });

  it('returns projectsActive count', async () => {
    const res = await request(app).get('/api/stats').set(auth());
    expect(res.body.projectsActive).toBe(2);
  });

  it('returns currentModule defaulting to 1', async () => {
    const res = await request(app).get('/api/stats').set(auth());
    expect(res.body.currentModule).toBe(1);
  });

  it('returns weeklyCompleted count', async () => {
    const res = await request(app).get('/api/stats').set(auth());
    // All 3 completed tasks were just created so they fall within the last 7 days
    expect(res.body.weeklyCompleted).toBe(3);
  });
});
