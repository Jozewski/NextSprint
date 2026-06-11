// SQLite via Node's built-in node:sqlite module (Node 22.5+, stable in Node 24).
// Zero native dependencies — nothing to compile, works the same on every machine.
// The API is synchronous, which keeps route handlers simple, and the schema is
// created automatically on first run, so there are no migrations to manage.
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'nextsprint.db');

const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    current_module INTEGER NOT NULL DEFAULT 1,
    github TEXT NOT NULL DEFAULT '',
    portfolio TEXT NOT NULL DEFAULT '',
    resume_status TEXT NOT NULL DEFAULT 'not-started'
      CHECK (resume_status IN ('not-started', 'in-progress', 'complete')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog'
      CHECK (status IN ('backlog', 'todo', 'in-progress', 'review', 'complete')),
    priority TEXT NOT NULL DEFAULT 'medium'
      CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT NOT NULL DEFAULT 'coursework'
      CHECK (category IN ('coursework', 'career', 'mentorship')),
    due_date TEXT,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_owner ON tasks(owner_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
`);

export default db;
