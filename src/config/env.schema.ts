import { z } from 'zod';
import { Environment } from './environment.enum';

export const envSchema = z.object({
  NODE_ENV: z.enum(Environment).default(Environment.Development),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  // One list, two consumers: better-auth rejects any callbackURL/redirectTo/origin outside it
  // with 403, and CORS refuses the browser preflight. They must agree, so they read the same var.
  TRUSTED_ORIGINS: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).nonempty()),
  MINIO_ENDPOINT: z.string().trim().min(1).default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  // Development-only defaults match docker-compose. Deployments must override both credentials.
  MINIO_ACCESS_KEY: z.string().min(3).default('minioadmin'),
  MINIO_SECRET_KEY: z.string().min(8).default('minioadmin'),
  MINIO_BUCKET: z.string().trim().min(3).max(63).default('advisory-platform'),
  // Omise
  OMISE_PUBLIC_KEY: z.string(),
  OMISE_SECRET_KEY: z.string(),
  CURRENCY_CODE: z.string().lowercase().default('thb'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
