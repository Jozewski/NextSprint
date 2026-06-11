# NextSprint — Test Summary

## Overview

| Layer | Test Files | Tests | Status |
|-------|-----------|-------|--------|
| Backend (server) | 6 | 55 | ✅ All passing |
| Frontend (client) | 4 | 28 | ✅ All passing |
| **Total** | **10** | **83** | ✅ |

---

## TDD Process — Red → Green → Refactor

### RED Phase 🔴
Tests were written first to define the expected contract for each endpoint and component **before** any wiring was confirmed. Each test file starts with a comment marking the RED boundary.

### GREEN Phase 🟢
Running the tests against the existing implementation revealed two real failures caught during this phase:

| File | Bug Found | Fix |
|------|-----------|-----|
| `Dashboard.test.jsx` | `"Due today"` matched two elements (stat card `<p>` + section `<h2>`) | Switched `getByText` → `getAllByText` |
| `Dashboard.test.jsx` | Expected `62%` but `Math.round(5/8 * 100)` = `63` | Corrected assertion to `63%` |

### REFACTOR Phase 🔵
No logic was changed. Tests act as a safety net for any future refactors.

---

## Backend Integration Tests (`nextsprint/server/src/__tests__/`)

> **Setup:** Each test file runs in its own Vitest worker with a fresh in-memory SQLite database (`DB_PATH=:memory:`). No test data leaks between files.

### `health.test.js` — 1 test
| Test | Assertion |
|------|-----------|
| GET /api/health | Returns `200`, `ok: true`, `db: 'sqlite'` |

---

### `auth.test.js` — 11 tests

#### POST /api/auth/register
| Test | Expected |
|------|----------|
| Valid registration | `201`, JWT token, public user profile (no `password_hash`) |
| Missing name | `400` with "required" message |
| Password under 6 chars | `400` with "6 characters" message |
| Duplicate email | `409` with "already exists" message |
| Mixed-case email | Stored and returned as lowercase |

#### POST /api/auth/login
| Test | Expected |
|------|----------|
| Valid credentials | `200`, JWT token, user profile |
| Wrong password | `401` with "invalid" message |
| Unknown email | `401` |
| Missing password | `400` with "required" message |
| Uppercase email input | `200` — login is case-insensitive |

---

### `projects.test.js` — 12 tests

#### GET /api/projects
| Test | Expected |
|------|----------|
| New user | Empty array |
| No token | `401` |

#### POST /api/projects
| Test | Expected |
|------|----------|
| Valid payload | `201`, project with `taskCount: 0` |
| No description | `201`, `description: ""` |
| Blank title | `400` |
| Created project appears in GET | Confirmed |

#### PUT /api/projects/:id
| Test | Expected |
|------|----------|
| Update title + description | `200`, updated fields |
| Other user's project | `404` (ownership guard) |
| Blank title | `400` |

#### DELETE /api/projects/:id
| Test | Expected |
|------|----------|
| Own project | `200`, `ok: true` |
| Double-delete | `404` |
| Other user's project | `404` |

---

### `tasks.test.js` — 16 tests

#### GET /api/tasks
| Test | Expected |
|------|----------|
| New user | Empty array |
| No token | `401` |

#### POST /api/tasks
| Test | Expected |
|------|----------|
| Minimal payload | `201`, defaults: `backlog / medium / coursework` |
| With `projectId` | Task linked to project |
| `status: complete` at creation | `completedAt` is stamped |
| Blank title | `400` |
| Invalid status | `400` |
| Invalid priority | `400` |
| Invalid category | `400` |
| Another user's `projectId` | `400` "Project not found" |
| `?projectId=` filter | Only returns tasks for that project |
| `?status=` filter | Only returns tasks with that status |

#### PUT /api/tasks/:id (Kanban drag)
| Test | Expected |
|------|----------|
| Move to `in-progress` | `200`, status updated |
| Move to `complete` | `completedAt` stamped |
| Move back from `complete` | `completedAt` cleared |
| Other user's task | `404` |

#### DELETE /api/tasks/:id
| Test | Expected |
|------|----------|
| Own task | `200`, `ok: true` |
| Double-delete | `404` |

---

### `users.test.js` — 7 tests

#### GET /api/users/me
| Test | Expected |
|------|----------|
| Authenticated | `200`, profile (no `password_hash`) |
| No token | `401` |
| Invalid token | `401` |

#### PUT /api/users/me
| Test | Expected |
|------|----------|
| Update name + github | `200`, updated fields |
| Update `resumeStatus: in-progress` | `200` |
| Invalid `resumeStatus` | `400` |
| Update `currentModule` | `200`, new value returned |

---

### `stats.test.js` — 7 tests

Seeded data: 3 complete tasks, 2 incomplete, 1 due today (incomplete), 1 due today (complete), 2 projects.

| Test | Expected Value |
|------|---------------|
| No token | `401` |
| `tasksCompleted` | `3` |
| `tasksRemaining` | `2` |
| `tasksDueToday` (excludes complete) | `1` |
| `projectsActive` | `2` |
| `currentModule` (default) | `1` |
| `weeklyCompleted` | `3` |

---

## Frontend Component Tests (`nextsprint/client/src/__tests__/`)

> **Setup:** Vitest with `jsdom` environment. `@testing-library/jest-dom` matchers loaded globally. All API calls and routing are mocked — no real server needed.

### `api.test.js` — 6 tests

| Test | Assertion |
|------|-----------|
| GET request returns parsed JSON | Response body returned correctly |
| No token in localStorage | No `Authorization` header sent |
| Token in localStorage | `Bearer <token>` header attached |
| POST with body | Body JSON-stringified, `Content-Type` set |
| Non-ok response with error field | Throws server error message |
| Non-ok response without error field | Throws `"Request failed (500)"` |

---

### `Login.test.jsx` — 8 tests

| Test | Assertion |
|------|-----------|
| Renders form fields | Email, password inputs and button present |
| Link to register page | `/register` href |
| Calls `login()` with credentials | Correct args on submit |
| Navigates to `/` on success | `navigate('/')` called |
| Shows `"Logging in…"` while in flight | Loading text + disabled button |
| Shows error on failed login | Server error message displayed |
| Clears error on retry | Previous error disappears |
| Submits on Enter key | `login()` called via keyboard |

---

### `Register.test.jsx` — 6 tests

| Test | Assertion |
|------|-----------|
| Renders all three fields + button | Name, email, password, submit |
| Link to login page | `/login` href |
| Client-side password validation | Error shown, `register()` NOT called |
| Calls `register()` with correct args | Name, email, password passed |
| Navigates to `/` on success | `navigate('/')` called |
| Shows `"Creating account…"` in flight | Loading text + disabled button |
| Displays server error | Error message rendered |

---

### `Dashboard.test.jsx` — 7 tests

| Test | Assertion |
|------|-----------|
| Loading state | `"Loading dashboard…"` shown before data |
| Stat cards rendered | Due today, Tasks remaining, Active projects, Current module |
| Due-today list | Only non-complete tasks matching today's date shown |
| Empty due-today list | `"Nothing due today"` message + board link |
| Mark complete button | `PUT /api/tasks/:id` called with `status: complete` |
| Progress percentage | `63%` displayed (5 of 8 complete = Math.round(62.5)) |
| API error | Error message rendered |

---

## How to Run

```bash
# Backend tests
cd nextsprint/server
npm test              # one-shot run
npm run test:watch    # re-runs on file save
npm run test:ui       # browser UI at http://localhost:51204

# Frontend tests
cd nextsprint/client
npm test
npm run test:watch
npm run test:ui
```

## Key Design Decisions

- **In-memory SQLite per worker** — `DB_PATH=:memory:` set in `src/__tests__/setup.js` before any module loads. Each test file gets a clean database with zero shared state.
- **`index.js` exports `app`** — added `import.meta.url` check so `app.listen()` only fires when the file is run directly, never when imported by Supertest.
- **Mocked API in frontend tests** — `vi.mock('../api')` keeps component tests fast and isolated from the network. Only behavior visible to the user is asserted.
- **`globals: true` in Vite test config** — required for `@testing-library/jest-dom` to extend the global `expect`.
