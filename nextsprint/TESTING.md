# NextSprint Integration Testing Notes

## TDD Process Used

### Red-Green-Refactor Cycle

We followed the classic TDD flow for frontend/backend integration coverage:

1. **RED:** Write failing tests first to define expected integration behavior.
2. **GREEN:** Run the tests and implement only the code or harness needed to make the expected behavior pass.
3. **REFACTOR:** Keep the tests focused on the API contract and frontend/backend boundary without changing production behavior unnecessarily.

## Integration Behaviors Under Test

### Sidebar Team Chat Integration

File: `client/src/ChatSidebar.integration.test.jsx`

These tests define the shared sidebar chat behavior before implementation:

- Logged-out users do not see the team chat UI and do not make chat API calls.
- Logged-in users load shared teammate messages from `GET /api/chat/messages` with the saved JWT.
- The sidebar chat renders the mockup-level contract: `Team chat`, online count, teammate names, message text, message input, and send button.
- Sending a message posts to `POST /api/chat/messages` with `{ body, mentions }`.
- `@` mentions are parsed client-side into usernames, for example `@Phil` becomes `mentions: ['Phil']`.
- The chat contract uses the existing REST API path through `client/src/api.js`; no WebSocket is required by these tests.
- The data host in this app is local SQLite through `server/src/db.js` using Node's built-in `node:sqlite`.

### Backend API Integration

File: `server/src/api.integration.test.js`

These tests exercise the Express routers and auth middleware together with mocked database calls:

- Protected resources reject requests without a bearer token.
- Registration returns a JWT and public user payload.
- Profile updates preserve the frontend camelCase contract.
- Project creation returns project data with `taskCount`.
- Task creation accepts frontend camelCase fields like `dueDate` and `projectId`.
- Task status updates stamp `completedAt` when moved to `complete`.
- Dashboard stats reflect created projects and completed tasks.
- User isolation prevents one user from seeing or attaching tasks to another user's project.

### Frontend API Wrapper Integration

File: `client/src/api.test.js`

These tests verify the shared frontend API wrapper:

- Requests are sent to the backend base URL with JSON headers.
- The saved JWT is attached as `Authorization: Bearer <token>`.
- Backend error payloads become readable thrown errors.

### Frontend Route Integration

File: `client/src/App.integration.test.jsx`

These tests render the React app with mocked backend responses shaped like the real API:

- Registration posts to `/api/auth/register`, stores the returned token, and loads dashboard data with authenticated requests.
- Projects page loads `/api/projects` and posts new projects in the backend contract shape.
- Board page loads tasks/projects and posts new tasks with `title`, `description`, `status`, `priority`, `category`, `dueDate`, and `projectId`.

## Test Results This Session

### Chat Message Ordering RED Phase Observed

File: `server/src/routes/chat.test.js`

Command:

```bash
cd nextsprint/server
npm test -- src/routes/chat.test.js
```

Result:

- Failed: `GET /api/chat/messages` returns messages oldest first.
- Expected newest-first body order: `['Auth routes green', 'Repo is up']`.
- Received body order: `['Repo is up', 'Auth routes green']`.
- Author names were included in the response shape, but the message order is still incorrect.

Failure excerpt:

```text
AssertionError: expected [ 'Repo is up', 'Auth routes green' ] to deeply equal [ 'Auth routes green', 'Repo is up' ]
```

Why it fails:

- `server/src/routes/chat.js` currently sorts with `ORDER BY m.created_at ASC, m.id ASC`.
- The user story requires newest-first ordering, which should use `ORDER BY m.created_at DESC, m.id DESC`.

Sandbox note:

- The first local run failed before assertions with `listen EPERM: operation not permitted 0.0.0.0`.
- Rerunning the same focused test with local Supertest binding allowed produced the assertion failure above.

### Chat Message Ordering GREEN Phase Observed

Command:

```bash
cd nextsprint/server
npm test -- src/routes/chat.test.js
```

Result:

- Passed: `server/src/routes/chat.test.js`.
- Passed: `GET /api/chat/messages` returns messages newest first.
- Passed: response messages still include author names.
- Test total: 1 test passed.

Full server suite command:

```bash
cd nextsprint/server
npm test
```

Result:

- Passed: 9 test files.
- Passed: 61 tests.

Sandbox note:

- The sandboxed full-suite run still fails before assertions with `listen EPERM: operation not permitted 0.0.0.0`.
- Rerunning with local Supertest binding allowed produced the passing result above.

### Sidebar Chat Display Order RED Phase Observed

File: `client/src/ChatSidebar.integration.test.jsx`

Command:

```bash
cd nextsprint/client
npm test -- src/ChatSidebar.integration.test.jsx
```

Result:

- Failed: `renders API newest-first messages in classic chat order`.
- Passed: 3 existing sidebar chat tests.
- Test total: 4 tests, 3 passed and 1 failed.

Expected behavior:

- `GET /api/chat/messages` returns messages newest-first from the server.
- The sidebar should render messages in classic chat order: oldest at top, newest at bottom nearest the input.
- New sent messages should append at the bottom.

Failure excerpt:

```text
Expected element to have text content:
  Repo is up - branch from main, PRs only
Received:
  PAPhil AdamsAuth routes green, JWT middleware exported
```

Why it fails:

- `client/src/components/ChatSidebar.jsx` currently renders `messages.map(...)` directly.
- When the API provides newest-first data, the newest message appears at the top instead of the bottom.

### Sidebar Chat Display Order GREEN Phase Observed

Command:

```bash
cd nextsprint/client
npm test -- src/ChatSidebar.integration.test.jsx
```

Result:

- Passed: `client/src/ChatSidebar.integration.test.jsx`.
- Passed: API newest-first messages render in classic chat order, oldest at top and newest at bottom.
- Passed: existing sidebar chat behaviors still pass.
- Test total: 4 tests passed.

Full client suite command:

```bash
cd nextsprint/client
npm test
```

Result:

- Passed: 7 test files.
- Passed: 37 tests.

Full server suite command:

```bash
cd nextsprint/server
npm test
```

Result:

- Passed: 9 test files.
- Passed: 61 tests.

Sandbox note:

- The sandboxed server suite still fails before assertions with `listen EPERM: operation not permitted 0.0.0.0`.
- Rerunning with local Supertest binding allowed produced the passing server result above.

### Sidebar Chat RED Phase Observed

Command:

```bash
cd nextsprint/client
npm test
```

Result:

- Failed: `client/src/ChatSidebar.integration.test.jsx`.
- Passed: logged-out users do not see the team chat UI.
- Failed: logged-in users cannot load shared teammate messages yet because Testing Library cannot find `role="region"` with name `/team chat/i`.
- Failed: logged-in users cannot send a chat message with `@` mentions yet for the same missing sidebar chat region.
- Suite total: 7 test files, 6 passed and 1 failed.
- Test total: 36 tests, 34 passed and 2 failed.

Expected pass criteria after implementation:

- The protected app shell renders an accessible sidebar chat region named `Team chat`.
- The chat loads messages from `GET /api/chat/messages` with `Authorization: Bearer <token>`.
- The chat sends messages to `POST /api/chat/messages` with the existing JSON API wrapper.
- `@Phil I can review the task API next` posts `{ body: '@Phil I can review the task API next', mentions: ['Phil'] }`.
- The sent message appears in the chat after the API returns `201`.
- `WebSocket` is not constructed by the client chat tests.

### Sidebar Chat GREEN Phase Observed

Command:

```bash
cd nextsprint/client
npm test
```

Result:

- Passed: 7 test files.
- Passed: 36 tests.
- The sidebar chat tests now pass with the REST API contract and without constructing `WebSocket`.

Build command:

```bash
cd nextsprint/client
npm run build
```

Result:

- Passed: production Vite build completed.

Backend verification command:

```bash
cd nextsprint/server
npx vitest run src/api.integration.test.js
```

Result:

- Passed: 1 test file.
- Passed: 3 tests.

Full backend suite command:

```bash
cd nextsprint/server
npm test
```

Result:

- Failed in this sandbox because existing Supertest tests attempted to bind `0.0.0.0` and hit `listen EPERM`.
- The failure matches the previously documented backend harness limitation and was not a chat-route assertion failure.

### RED Phase Observed

Command:

```bash
cd nextsprint/server
npm test
```

Result:

- Failed before route assertions because Supertest attempted to bind an ephemeral local test server.
- Sandbox error: `listen EPERM: operation not permitted 0.0.0.0`.
- This confirmed the first backend integration harness could not run in the sandbox.

### Refactor

The backend suite was refactored to mock database calls and invoke the Express routers directly. This keeps the tests focused on the route/API contract while avoiding both SQLite setup and local socket binding.

### Client Suite

Command:

```bash
cd nextsprint/client
npm test
```

Result:

- Passed: 2 test files.
- Passed: 5 tests.

### Backend Suite

Command:

```bash
cd nextsprint/server
npm test
```

Result:

- Passed: 1 test file.
- Passed: 3 tests.

## Clarifying Questions

- Do you want these tests to remain split by package (`client` and `server`), or should we add a root-level test command to run both?
- Should we also keep a smaller real-database smoke test for CI, separate from the mocked route integration tests?
