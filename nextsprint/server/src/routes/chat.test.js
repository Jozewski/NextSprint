import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../db.js';

const registerUser = async (name, email) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123' });

  return res.body.token;
};

describe('GET /api/chat/messages', () => {
  beforeEach(() => {
    db.exec('DELETE FROM chat_mentions');
    db.exec('DELETE FROM chat_messages');
    db.exec('DELETE FROM users');
  });

  it('returns messages newest first with author names', async () => {
    const joanneToken = await registerUser('Joanne Liszewski', 'joanne.chat@test.com');
    const philToken = await registerUser('Phil Adams', 'phil.chat@test.com');

    await request(app)
      .post('/api/chat/messages')
      .set({ Authorization: `Bearer ${joanneToken}` })
      .send({ body: 'Repo is up' });
    await request(app)
      .post('/api/chat/messages')
      .set({ Authorization: `Bearer ${philToken}` })
      .send({ body: 'Auth routes green' });

    const res = await request(app)
      .get('/api/chat/messages')
      .set({ Authorization: `Bearer ${joanneToken}` });

    expect(res.status).toBe(200);
    expect(res.body.messages.map((message) => message.body)).toEqual([
      'Auth routes green',
      'Repo is up',
    ]);
    expect(res.body.messages.map((message) => message.author.name)).toEqual([
      'Phil Adams',
      'Joanne Liszewski',
    ]);
  });
});
