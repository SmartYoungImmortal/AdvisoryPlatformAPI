import type { Env } from './env.schema';

/**
 * Named keys for `ConfigService.get(...)` calls, so a renamed env var is a one-line
 * change instead of a repo-wide string search. `satisfies Record<keyof Env, keyof Env>`
 * makes this self-checking: adding a var to `envSchema` without adding it here (or
 * vice versa) is a compile error, not a silent gap.
 */
export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_URL: 'DATABASE_URL',
  BETTER_AUTH_SECRET: 'BETTER_AUTH_SECRET',
  BETTER_AUTH_URL: 'BETTER_AUTH_URL',
  TRUSTED_ORIGINS: 'TRUSTED_ORIGINS',
  MINIO_ENDPOINT: 'MINIO_ENDPOINT',
  MINIO_PORT: 'MINIO_PORT',
  MINIO_USE_SSL: 'MINIO_USE_SSL',
  MINIO_ACCESS_KEY: 'MINIO_ACCESS_KEY',
  MINIO_SECRET_KEY: 'MINIO_SECRET_KEY',
  MINIO_BUCKET: 'MINIO_BUCKET',
  OMISE_PUBLIC_KEY: 'OMISE_PUBLIC_KEY',
  OMISE_SECRET_KEY: 'OMISE_SECRET_KEY',
  CURRENCY_CODE: 'CURRENCY_CODE',
} as const satisfies Record<keyof Env, keyof Env>;
