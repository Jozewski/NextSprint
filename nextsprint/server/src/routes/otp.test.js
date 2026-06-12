import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Set test env variables BEFORE importing app or db
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'otp_test_jwt_secret_key_long_enough';
process.env.DB_PATH = ':memory:';

// Mock the email service so no actual email logging or network calls occur in tests
vi.mock('../services/email.js', () => ({
  sendOTP: vi.fn(),
}));

import { sendOTP } from '../services/email.js';
import db from '../db.js';
import app from '../index.js';

describe('OTP Auth Routes - TDD Cycle', () => {
  beforeEach(() => {
    // Clear databases before each test to ensure isolation
    try {
      db.exec('DELETE FROM users');
      db.exec('DELETE FROM login_codes');
    } catch (err) {
      // Handle cases where login_codes table hasn't been created yet in the RED phase
    }
    vi.clearAllMocks();
  });

  describe('POST /api/auth/otp/send', () => {
    it('should successfully generate and "send" an OTP for a valid email', async () => {
      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ email: 'test@nextsprint.dev' });

      // In the RED phase, this will return 404 because the route is not registered
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      // Assert the mocked email service was called
      expect(sendOTP).toHaveBeenCalledOnce();
      expect(sendOTP).toHaveBeenCalledWith('test@nextsprint.dev', expect.stringMatching(/^\d{3}-\d{3}$/));

      // Assert the code exists in the database
      const row = db.prepare('SELECT * FROM login_codes WHERE email = ?').get('test@nextsprint.dev');
      expect(row).toBeDefined();
      expect(row.code).toMatch(/^\d{3}-\d{3}$/);
      expect(row.used).toBe(0);
    });

    it('should reject invalid email formats', async () => {
      const res = await request(app)
        .post('/api/auth/otp/send')
        .send({ email: 'invalid-email-format' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid email');
      expect(sendOTP).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/otp/verify', () => {
    it('should fail if verification code does not match', async () => {
      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: 'test@nextsprint.dev', code: '000-000' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid or expired');
    });

    it('should fail if code is expired', async () => {
      // Attempt to seed an expired code in DB
      try {
        const expiresAt = new Date(Date.now() - 60 * 1000).toISOString();
        db.prepare("INSERT INTO login_codes (email, code, expires_at) VALUES (?, ?, ?)")
          .run('test@nextsprint.dev', '111-111', expiresAt);
      } catch (err) {
        // If table doesn't exist yet, we let it slide in the early RED phase
      }

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: 'test@nextsprint.dev', code: '111-111' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid or expired');
    });

    it('should successfully verify code, auto-register new user, and return JWT token', async () => {
      // Seed a valid code in DB
      try {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        db.prepare("INSERT INTO login_codes (email, code, expires_at) VALUES (?, ?, ?)")
          .run('newuser@nextsprint.dev', '123-456', expiresAt);
      } catch (err) {
        // Let it slide in early RED phase
      }

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: 'newuser@nextsprint.dev', code: '123-456' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('newuser@nextsprint.dev');

      // Assert the user was added to DB
      const user = db.prepare('SELECT id FROM users WHERE email = ?').get('newuser@nextsprint.dev');
      expect(user).toBeDefined();

      // Assert code was marked used
      const codeRow = db.prepare('SELECT used FROM login_codes WHERE email = ?').get('newuser@nextsprint.dev');
      expect(codeRow.used).toBe(1);
    });

    it('should successfully verify code and log in existing user without creating duplicate records', async () => {
      // Pre-register user in DB
      db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        .run('Existing User', 'existing@nextsprint.dev', 'dummy_hash');

      // Seed valid code in DB
      try {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        db.prepare("INSERT INTO login_codes (email, code, expires_at) VALUES (?, ?, ?)")
          .run('existing@nextsprint.dev', '789-012', expiresAt);
      } catch (err) {
        // Let it slide in early RED phase
      }

      const res = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: 'existing@nextsprint.dev', code: '789-012' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.name).toBe('Existing User');

      // Assert users table still has exactly 1 user with this email
      const userCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE email = ?').get('existing@nextsprint.dev').count;
      expect(userCount).toBe(1);
    });
  });
});
