/** Call before any destructive test seed/reset; never read a developer .env as permission. */
export function assertDisposableTestDatabase(env: NodeJS.ProcessEnv = process.env): void {
  let database: URL;
  try {
    database = new URL(env.DATABASE_URL || '');
  } catch {
    throw new Error('Tests require an explicit disposable local/CI PostgreSQL database ending in _test.');
  }
  if (env.NODE_ENV === 'production' ||
      !['postgres:', 'postgresql:'].includes(database.protocol) ||
      !['localhost', '127.0.0.1', 'postgres'].includes(database.hostname) ||
      !/^\/[A-Za-z0-9_]+_test$/.test(database.pathname)) {
    throw new Error('Tests require an explicit disposable local/CI PostgreSQL database ending in _test.');
  }
}
