// ===== Developer 4: Dashboard stats =====
// One aggregate endpoint so the dashboard needs a single fetch.
import { Router } from 'express';
import db from '../db.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/stats
router.get('/', (req, res) => {
  const userId = req.user.id;

  const tasksCompleted = db
    .prepare("SELECT COUNT(*) AS n FROM tasks WHERE owner_id = ? AND status = 'complete'")
    .get(userId).n;

  const tasksRemaining = db
    .prepare("SELECT COUNT(*) AS n FROM tasks WHERE owner_id = ? AND status != 'complete'")
    .get(userId).n;

  const tasksDueToday = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tasks
       WHERE owner_id = ? AND status != 'complete'
       AND due_date = date('now', 'localtime')`
    )
    .get(userId).n;

  const projectsActive = db
    .prepare('SELECT COUNT(*) AS n FROM projects WHERE owner_id = ?')
    .get(userId).n;

  const weeklyCompleted = db
    .prepare(
      `SELECT COUNT(*) AS n FROM tasks
       WHERE owner_id = ? AND completed_at >= datetime('now', '-7 days')`
    )
    .get(userId).n;

  const currentModule = db
    .prepare('SELECT current_module AS m FROM users WHERE id = ?')
    .get(userId).m;

  res.json({
    tasksCompleted,
    tasksRemaining,
    tasksDueToday,
    projectsActive,
    weeklyCompleted,
    currentModule,
  });
});

export default router;
