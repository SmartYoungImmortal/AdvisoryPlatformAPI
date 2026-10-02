import { config } from 'dotenv';

config({ quiet: true });

/**
 * The integration and e2e suites are destructive: they `TRUNCATE`, `DROP TABLE`, and
 * `DELETE FROM user` to get a clean slate. They used to read `DATABASE_URL` — the same
 * variable the application reads — which was harmless while that pointed at the Docker
 * Compose Postgres on localhost. It is not harmless now that it points at the shared
 * Supabase project.
 *
 * So the suites read `TEST_DATABASE_URL` instead, and this file redirects `DATABASE_URL`
 * at it before anything resolves the variable: the integration specs construct their own
 * `Pool` from `process.env`, and the e2e specs boot the real `AppModule`, whose
 * `ConfigModule` reads `process.env` at init and caches the result.
 *
 * `dotenv` never overwrites a value already present in the environment, so an explicit
 * `TEST_DATABASE_URL` in the shell or in CI still wins over `.env`.
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Start the test database with `docker compose up -d postgres` ' +
      'and copy the value from .env.example. These suites drop and truncate tables, so they must ' +
      'never inherit the application database.',
  );
}

/**
 * A test database is one this repository is allowed to destroy, which in practice means one
 * it started itself. Anything reachable over the network is somebody else's data.
 */
const DISPOSABLE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'postgres',
  'host.docker.internal',
]);

const { hostname } = new URL(testDatabaseUrl);

if (!DISPOSABLE_HOSTS.has(hostname)) {
  throw new Error(
    `TEST_DATABASE_URL points at "${hostname}", which is not a disposable local database. ` +
      'These suites drop and truncate tables; refusing to run against a remote host.',
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
