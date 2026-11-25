import { describe, expect, it } from 'vitest';
import { assertDisposableTestDatabase } from './helpers/disposableDatabase';

describe('D2-CONT-06: destructive test setup rejects unsafe database targets', () => {
  it.each(['localhost', '127.0.0.1', 'postgres'])(
    'permits explicit disposable PostgreSQL on %s', host => {
      expect(() => assertDisposableTestDatabase({
        DATABASE_URL: `postgresql://test:test@${host}:5432/course_pms_test?schema=public`,
        NODE_ENV: 'test',
      })).not.toThrow();
    });
  it.each([
    {},
    { DATABASE_URL: 'not-a-url' },
    { DATABASE_URL: 'postgresql://localhost/course_pms' },
    { DATABASE_URL: 'postgresql://production.example.org/course_pms_test' },
    { DATABASE_URL: 'postgresql://localhost/course_pms_test', NODE_ENV: 'production' },
    { DATABASE_URL: 'https://localhost/course_pms_test' },
    { DATABASE_URL: 'postgresql://localhost/course_pms_test/other_test' },
  ])('rejects unsafe or missing configuration before reset', env => {
    expect(() => assertDisposableTestDatabase(env)).toThrow('disposable local/CI PostgreSQL');
  });
});
