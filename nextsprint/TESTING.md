# NextSprint Integration Testing Notes

## TDD Process Used

### Red-Green-Refactor Cycle

We followed the classic TDD flow for frontend/backend integration coverage:

1. **RED:** Write failing tests first to define expected integration behavior.
2. **GREEN:** Run the tests and implement only the code or harness needed to make the expected behavior pass.
3. **REFACTOR:** Keep the tests focused on the API contract and frontend/backend boundary without changing production behavior unnecessarily.

## Integration Behaviors Under Test

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
