# NextSprint

A project and career management platform built for coding bootcamp students. Combines coursework, career, and mentorship task tracking in one dashboard with a drag-and-drop Kanban board.

**Stack:** React + Tailwind v4 (Vite) · Node/Express · SQLite via node:sqlite (built into Node — zero native dependencies) · JWT auth

```
nextsprint/
├── server/   Express API + SQLite
└── client/   React frontend
```

## Quick Start

### 1. Backend
```bash
cd server
npm install
cp .env.example .env        # then set JWT_SECRET to a long random string
npm run seed                # creates demo data
npm run dev                 # http://localhost:4000
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 2. Frontend (new terminal)
```bash
cd client
npm install
cp .env.example .env        # default points at localhost:4000
npm run dev                 # http://localhost:5173
```

### 3. Log in with demo data
```
demo@nextsprint.dev / password123
```

No database setup needed — SQLite is built into Node itself (`node:sqlite`), and `server/nextsprint.db` is created automatically on first run. **Requires Node 22.5+** (check with `node -v`). On Node 22 you may see an "experimental" warning at startup — it is safe to ignore; the module is stable in Node 23.4+.

## Team Ownership

| Developer | Backend | Frontend |
|---|---|---|
| Dev 1 — Auth | `routes/auth.js`, `routes/users.js`, `middleware/auth.js` | `Login.jsx`, `Register.jsx`, `Profile.jsx`, `AuthContext.jsx` |
| Dev 2 — Projects | `routes/projects.js` | `Projects.jsx` |
| Dev 3 — Tasks | `routes/tasks.js` | `Board.jsx`, `TaskModal.jsx` |
| Dev 4 — Dashboard | `routes/stats.js`, `seed.js`, deployment | `Dashboard.jsx`, `Layout.jsx`, global polish |

## API Reference

All protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Body / Query | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | `{token, user}` |
| POST | `/api/auth/login` | `{email, password}` | `{token, user}` |
| GET | `/api/users/me` | — | `{user}` |
| PUT | `/api/users/me` | profile fields | `{user}` |
| GET | `/api/projects` | — | `{projects}` |
| POST | `/api/projects` | `{title, description}` | `{project}` |
| PUT | `/api/projects/:id` | fields | `{project}` |
| DELETE | `/api/projects/:id` | — | `{ok: true}` |
| GET | `/api/tasks` | `?projectId=&status=` | `{tasks}` |
| POST | `/api/tasks` | task fields | `{task}` |
| PUT | `/api/tasks/:id` | changed fields | `{task}` |
| DELETE | `/api/tasks/:id` | — | `{ok: true}` |
| GET | `/api/stats` | — | stats object |

Task fields: `title`, `description`, `status` (backlog/todo/in-progress/review/complete), `priority` (low/medium/high), `category` (coursework/career/mentorship), `dueDate` (YYYY-MM-DD), `projectId`.

## Deployment

### Frontend → Vercel
- Root directory: `client`
- Framework preset: Vite
- Env var: `VITE_API_URL` = your Render API URL (no trailing slash)

### Backend → Render
- Root directory: `server`
- Build: `npm install` · Start: `npm start`
- Env vars: `JWT_SECRET`, `CLIENT_ORIGIN` (your Vercel URL), `DB_PATH`

**⚠️ Important — SQLite on Render:** Render's filesystem is ephemeral, so the database file is **wiped on every deploy/restart** unless you attach a persistent disk:
1. In the Render service, add a Disk (e.g., 1 GB) mounted at `/var/data`
2. Set `DB_PATH=/var/data/nextsprint.db`
3. Note: persistent disks require a paid Render instance. **Free-tier fallback for the hackathon:** accept that data resets on deploy, and run `npm run seed` from the Render shell (or add seeding to the start script) so the demo always has data. For a 2-day demo this is totally fine.

## Hackathon Rules of Engagement
1. Frontend never waits on backend — the API contract above is the source of truth
2. Merge to main every 2–3 hours
3. Feature freeze at Day 2 midday; bugs only after that
4. Seed data before the demo — an empty board demos terribly
5. Dev 4 owns deployment so it's one person's job, not everyone's panic
