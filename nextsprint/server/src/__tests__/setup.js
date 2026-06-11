// Runs in each vitest worker before any test file is loaded.
// Setting these before any import ensures db.js uses in-memory SQLite
// and JWT signing uses a known secret — never reads from .env.
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'vitest-secret-do-not-use-in-prod';
