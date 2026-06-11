// ===== Developer 3: Tasks (CRUD + Kanban status updates) =====
import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

const STATUSES = ['backlog', 'todo', 'in-progress', 'review', 'complete'];
const PRIORITIES = ['low', 'medium', 'high'];
const CATEGORIES = ['coursework', 'career', 'mentorship'];

const TASK_FIELDS = `
  id, title, description, status, priority, category,
  due_date AS dueDate,
  project_id AS projectId,
  completed_at AS completedAt,
  created_at AS createdAt
`;

// GET /api/tasks?projectId=&status=
router.get('/', (req, res) => {
  let sql = `SELECT ${TASK_FIELDS} FROM tasks WHERE owner_id = ?`;
  const params = [req.user.id];

  if (req.query.projectId) {
    sql += ' AND project_id = ?';
    params.push(req.query.projectId);
  }
  if (req.query.status) {
    sql += ' AND status = ?';
    params.push(req.query.status);
  }
  sql += ' ORDER BY created_at DESC';

  res.json({ tasks: db.prepare(sql).all(...params) });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const {
    title,
    description = '',
    status = 'backlog',
    priority = 'medium',
    category = 'coursework',
    dueDate = null,
    projectId = null,
  } = req.body || {};

  if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required' });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: `priority must be one of: ${PRIORITIES.join(', ')}` });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });

  // If a project is given, make sure it belongs to this user
  if (projectId) {
    const project = db
      .prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?')
      .get(projectId, req.user.id);
    if (!project) return res.status(400).json({ error: 'Project not found' });
  }

  const completedAt = status === 'complete' ? new Date().toISOString() : null;

  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, status, priority, category, due_date, project_id, owner_id, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(title.trim(), description, status, priority, category, dueDate, projectId, req.user.id, completedAt);

  const task = db.prepare(`SELECT ${TASK_FIELDS} FROM tasks WHERE id = ?`).get(result.lastInsertRowid);
  res.status(201).json({ task });
});

function findOwnedTask(req, res) {
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return null;
  }
  return task;
}

// PUT /api/tasks/:id — also the drag-and-drop endpoint (status changes)
router.put('/:id', (req, res) => {
  const existing = findOwnedTask(req, res);
  if (!existing) return;

  const {
    title = existing.title,
    description = existing.description,
    status = existing.status,
    priority = existing.priority,
    category = existing.category,
    dueDate = existing.due_date,
    projectId = existing.project_id,
  } = req.body || {};

  if (!title.trim()) return res.status(400).json({ error: 'Task title is required' });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  if (!PRIORITIES.includes(priority)) return res.status(400).json({ error: `priority must be one of: ${PRIORITIES.join(', ')}` });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });

  if (projectId) {
    const project = db
      .prepare('SELECT id FROM projects WHERE id = ? AND owner_id = ?')
      .get(projectId, req.user.id);
    if (!project) return res.status(400).json({ error: 'Project not found' });
  }

  // Stamp completed_at when a task first moves to complete; clear it if it moves back
  let completedAt = existing.completed_at;
  if (status === 'complete' && existing.status !== 'complete') {
    completedAt = new Date().toISOString();
  } else if (status !== 'complete') {
    completedAt = null;
  }

  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, status = ?, priority = ?, category = ?,
         due_date = ?, project_id = ?, completed_at = ?
     WHERE id = ?`
  ).run(title.trim(), description, status, priority, category, dueDate, projectId, completedAt, existing.id);

  const task = db.prepare(`SELECT ${TASK_FIELDS} FROM tasks WHERE id = ?`).get(existing.id);
  res.json({ task });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const existing = findOwnedTask(req, res);
  if (!existing) return;

  db.prepare('DELETE FROM tasks WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

export default router;
