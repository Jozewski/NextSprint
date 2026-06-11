import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// ---- RED: define what /api/health must return ----
describe('GET /api/health', () => {
  it('returns 200 with ok:true and db identifier', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.db).toBe('sqlite');
  });
});
