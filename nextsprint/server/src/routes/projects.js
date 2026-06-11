// ===== Developer 2: Projects =====
import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

const PROJECT_FIELDS = `
  p.id, p.title, p.description, p.created_at AS createdAt,
  (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS taskCount
`;

// GET /api/projects — current user's projects
router.get('/', (req, res) => {
  const projects = db
    .prepare(`SELECT ${PROJECT_FIELDS} FROM projects p WHERE p.owner_id = ? ORDER BY p.created_at DESC`)
    .all(req.user.id);
  res.json({ projects });
});

// POST /api/projects
router.post('/', (req, res) => {
  const { title, description = '' } = req.body || {};
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  const result = db
    .prepare('INSERT INTO projects (title, description, owner_id) VALUES (?, ?, ?)')
    .run(title.trim(), description, req.user.id);

  const project = db
    .prepare(`SELECT ${PROJECT_FIELDS} FROM projects p WHERE p.id = ?`)
    .get(result.lastInsertRowid);

  res.status(201).json({ project });
});

// Ownership guard for :id routes
function findOwnedProject(req, res) {
  const project = db
    .prepare('SELECT * FROM projects WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  return project;
}

// PUT /api/projects/:id
router.put('/:id', (req, res) => {
  const existing = findOwnedProject(req, res);
  if (!existing) return;

  const { title = existing.title, description = existing.description } = req.body || {};
  if (!title.trim()) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  db.prepare('UPDATE projects SET title = ?, description = ? WHERE id = ?')
    .run(title.trim(), description, existing.id);

  const project = db
    .prepare(`SELECT ${PROJECT_FIELDS} FROM projects p WHERE p.id = ?`)
    .get(existing.id);
  res.json({ project });
});

// DELETE /api/projects/:id — tasks cascade via foreign key
router.delete('/:id', (req, res) => {
  const existing = findOwnedProject(req, res);
  if (!existing) return;

  db.prepare('DELETE FROM projects WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

export default router;
