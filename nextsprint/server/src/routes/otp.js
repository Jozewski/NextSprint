import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { sendOTP } from '../services/email.js';

const router = Router();

const PUBLIC_USER = `
  id, name, email,
  current_module AS currentModule,
  github, portfolio,
  resume_status AS resumeStatus
`;

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// POST /api/auth/otp/send
router.post('/send', async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Generate random 6-digit code formatted as ###-###
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedCode = `${randomDigits.slice(0, 3)}-${randomDigits.slice(3)}`;

    // Set expiration 10 minutes in the future
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const normalizedEmail = email.toLowerCase().trim();

    // Invalidate any active previous codes for this email
    db.prepare('UPDATE login_codes SET used = 1 WHERE email = ?').run(normalizedEmail);

    // Save the new code
    db.prepare('INSERT INTO login_codes (email, code, expires_at) VALUES (?, ?, ?)')
      .run(normalizedEmail, formattedCode, expiresAt);

    // Call mock email sending service
    await sendOTP(normalizedEmail, formattedCode);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/otp/verify
router.post('/verify', (req, res) => {
  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();

    // Look for matching unexpired unused code
    const codeRow = db.prepare(`
      SELECT * FROM login_codes
      WHERE email = ? AND code = ? AND used = 0 AND expires_at > ?
      ORDER BY id DESC LIMIT 1
    `).get(normalizedEmail, code.trim(), now);

    if (!codeRow) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark the code as used
    db.prepare('UPDATE login_codes SET used = 1 WHERE id = ?').run(codeRow.id);

    // Check if the user already exists
    let user = db.prepare(`SELECT ${PUBLIC_USER} FROM users WHERE email = ?`).get(normalizedEmail);

    if (!user) {
      // Auto-register new user
      const name = normalizedEmail.split('@')[0];
      const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
        .run(name, normalizedEmail, 'otp_passwordless_account');

      user = db.prepare(`SELECT ${PUBLIC_USER} FROM users WHERE id = ?`).get(result.lastInsertRowid);
    }

    res.json({ token: signToken(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
