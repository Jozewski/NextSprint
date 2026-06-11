import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';

// Set environment variables before importing anything else
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'super_secret_test_key_for_hackathon';
process.env.DB_PATH = ':memory:';

import db from '../db.js';
import app from '../index.js';

describe('Auth Routes - TDD Cycle Demo', () => {
  beforeEach(() => {
    // Clear the database tables before each test to ensure test isolation
    db.exec('DELETE FROM users');
  });

  describe('POST /api/auth/register', () => {
    // 1. Existing functionality check
    it('should register a new user successfully with valid inputs', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Joanne Liszewski',
          email: 'joanne@nextsprint.dev',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.name).toBe('Joanne Liszewski');
      expect(res.body.user.email).toBe('joanne@nextsprint.dev');
    });

    // 2. RED Phase: Write a test for a missing feature (Email Format Validation)
    // This test defines the expected behavior (failing on email without '@' or domain)
    // and will FAIL when run because the route handler doesn't check email format yet.
    it('should reject registration if the email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Joanne Liszewski',
          email: 'invalid-email-no-at-sign',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Please enter a valid email address');
    });
  });
});
