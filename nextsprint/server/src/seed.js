// Demo data for development and the final demo.
// Run with: npm run seed
// Login afterwards with: demo@nextsprint.dev / password123
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from './db.js';

const DEMO_EMAIL = 'demo@nextsprint.dev';

// Wipe any previous demo data (projects/tasks cascade)
db.prepare('DELETE FROM users WHERE email = ?').run(DEMO_EMAIL);

const userResult = db
  .prepare('INSERT INTO users (name, email, password_hash, current_module, github, portfolio, resume_status) VALUES (?, ?, ?, ?, ?, ?, ?)')
  .run(
    'Demo Student',
    DEMO_EMAIL,
    bcrypt.hashSync('password123', 10),
    5,
    'https://github.com/demo-student',
    'https://demo-student.dev',
    'in-progress'
  );
const userId = userResult.lastInsertRowid;

const insertProject = db.prepare('INSERT INTO projects (title, description, owner_id) VALUES (?, ?, ?)');
const capstone = insertProject.run('Capstone Project', 'Full-stack capstone for graduation', userId).lastInsertRowid;
const portfolio = insertProject.run('Portfolio Site', 'Personal portfolio with project showcase', userId).lastInsertRowid;

const today = new Date().toISOString().slice(0, 10);
const inThreeDays = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
const lastWeek = new Date(Date.now() - 2 * 86400000).toISOString();

const insertTask = db.prepare(
  `INSERT INTO tasks (title, description, status, priority, category, due_date, project_id, owner_id, completed_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const tasks = [
  // [title, description, status, priority, category, dueDate, projectId, completedAt]
  ['Complete Module 5 lessons', 'Finish all videos and exercises', 'in-progress', 'high', 'coursework', today, null, null],
  ['Submit weekly reflection', 'Post in Slack by end of day', 'todo', 'medium', 'coursework', today, null, null],
  ['Finish React assignment', 'Build the component challenge', 'review', 'high', 'coursework', inThreeDays, capstone, null],
  ['Set up database schema', 'Design tables for capstone', 'complete', 'high', 'coursework', null, capstone, lastWeek],
  ['Build auth flow', 'Login and registration pages', 'in-progress', 'high', 'coursework', inThreeDays, capstone, null],
  ['Update resume', 'Add capstone project section', 'todo', 'high', 'career', inThreeDays, null, null],
  ['Apply to three jobs', 'Focus on junior full-stack roles', 'backlog', 'medium', 'career', null, null, null],
  ['Polish portfolio hero section', 'New headline and screenshots', 'todo', 'medium', 'career', null, portfolio, null],
  ['Meet with mentor', 'Weekly 1:1 — bring questions about APIs', 'todo', 'medium', 'mentorship', today, null, null],
  ['Practice interview questions', 'Two behavioral, two technical', 'backlog', 'low', 'mentorship', null, null, null],
  ['Mentor portfolio review', 'Walk through portfolio feedback', 'complete', 'medium', 'mentorship', null, portfolio, lastWeek],
];

for (const t of tasks) {
  insertTask.run(t[0], t[1], t[2], t[3], t[4], t[5], t[6], userId, t[7]);
}

console.log('Seeded demo data.');
console.log('Login with: demo@nextsprint.dev / password123');
