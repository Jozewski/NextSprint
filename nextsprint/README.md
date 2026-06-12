# NextSprint

NextSprint is a coursework progress tracker for a coding cohort. It combines student accounts, coursework projects, task boards, and dashboard stats so the demo can show realistic progress across the current curriculum.

The current demo data reflects the cohort at Week 7, Day 5: `TDD Team Build (Day 2 of 2): Vibe Code Friday`.

**Stack:** React + Tailwind v4 + Vite, Node/Express, SQLite via `node:sqlite`, JWT auth.

```text
nextsprint/
|-- server/   Express API + SQLite
`-- client/   React frontend
```

## Current Demo Data

Run `npm run seed` from `server/` to create the current cohort data.

The seed creates:

- 11 cohort users
- 44 projects
- 286 coursework tasks
- Accounts are registered under passwordless OTP authentication (no passwords).

Example login:

* Email: `actonitwithhelp@live.com` (or any seeded email in `server/src/seed.js`).
* Enter the email, click **Send Verification Code**, and retrieve the generated 6-digit code from the server console output to authenticate.

## Quick Start

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run seed
npm run dev
```

The API runs at:

```text
http://localhost:4000
```

Generate a JWT secret for `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Required backend environment variables:

```text
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=http://localhost:5173
```

Optional:

```text
DB_PATH=./nextsprint.db
PORT=4000
```

### Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The client defaults to `http://localhost:4000` for API calls. Set `VITE_API_URL` if the API is hosted somewhere else.

## Favicon

The app uses a PNG favicon at:

```text
client/public/favicon.png
```

`client/index.html` references it with:

```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

## Database

SQLite is created automatically on first run. No manual migration step is required.

Default local DB path:

```text
server/nextsprint.db
```

The app requires Node `22.5+` because it uses the built-in `node:sqlite` module.

## API Reference

All protected routes require:

```text
Authorization: Bearer <token>
```

| Method | Endpoint | Body / Query | Returns |
|---|---|---|---|
| GET | `/api/health` | none | `{ ok, db }` |
| POST | `/api/auth/otp/send` | `{ email }` | `{ ok: true }` |
| POST | `/api/auth/otp/verify` | `{ email, code }` | `{ token, user }` |
| GET | `/api/users/me` | none | `{ user }` |
| PUT | `/api/users/me` | profile fields | `{ user }` |
| GET | `/api/projects` | none | `{ projects }` |
| POST | `/api/projects` | `{ title, description }` | `{ project }` |
| PUT | `/api/projects/:id` | project fields | `{ project }` |
| DELETE | `/api/projects/:id` | none | `{ ok: true }` |
| GET | `/api/tasks` | `?projectId=&status=` | `{ tasks }` |
| POST | `/api/tasks` | task fields | `{ task }` |
| PUT | `/api/tasks/:id` | task fields | `{ task }` |
| DELETE | `/api/tasks/:id` | none | `{ ok: true }` |
| GET | `/api/stats` | none | dashboard stats |

Task fields:

```text
title
description
status: backlog | todo | in-progress | review | complete
priority: low | medium | high
category: coursework | career | mentorship
dueDate: YYYY-MM-DD
projectId
```

The current seed uses `coursework` tasks only.

## Tests

Backend:

```bash
cd server
npm test
```

Client:

```bash
cd client
npm test
```

Additional useful checks:

```bash
cd server
node --check src/seed.js
npm run seed
```

## Deployment Notes

### Frontend on Vercel

- Root directory: `client`
- Framework preset: Vite
- Environment variable: `VITE_API_URL=<backend API URL>`

### Backend on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `JWT_SECRET`, `CLIENT_ORIGIN`, optional `DB_PATH`

SQLite on Render needs a persistent disk if data must survive deploys/restarts. Without one, rerun `npm run seed` after deploy/restart to restore demo data.
