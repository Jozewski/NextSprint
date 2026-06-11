// ===== Developer 1: User profile =====
import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

const PUBLIC_USER = `
  id, name, email,
  current_module AS currentModule,
  github, portfolio,
  resume_status AS resumeStatus
`;

// GET /api/users/me
router.get('/me', (req, res) => {
  const user = db.prepare(`SELECT ${PUBLIC_USER} FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// PUT /api/users/me
router.put('/me', (req, res) => {
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!current) return res.status(404).json({ error: 'User not found' });

  const {
    name = current.name,
    currentModule = current.current_module,
    github = current.github,
    portfolio = current.portfolio,
    resumeStatus = current.resume_status,
  } = req.body || {};

  const validStatuses = ['not-started', 'in-progress', 'complete'];
  if (!validStatuses.includes(resumeStatus)) {
    return res.status(400).json({ error: `resumeStatus must be one of: ${validStatuses.join(', ')}` });
  }

  db.prepare(
    `UPDATE users
     SET name = ?, current_module = ?, github = ?, portfolio = ?, resume_status = ?
     WHERE id = ?`
  ).run(name, currentModule, github, portfolio, resumeStatus, req.user.id);

  const user = db.prepare(`SELECT ${PUBLIC_USER} FROM users WHERE id = ?`).get(req.user.id);
  res.json({ user });
});

export default router;
