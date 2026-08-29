import { z } from 'zod';
import { Environment } from './environment.enum';

export const envSchema = z
  .object({
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
    // Password-reset delivery is enabled only when both values are supplied. Keeping the
    // mail transport optional lets API-only local development run without an SMTP server.
    SMTP_URL: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.url().optional(),
    ),
    SMTP_FROM: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.email().optional(),
    ),
    ELASTICSEARCH_NODE: z.url().default('http://localhost:9200'),
    ELASTICSEARCH_REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(100)
      .max(30_000)
      .default(1_000),
    ELASTICSEARCH_API_KEY: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().min(1).optional(),
    ),
    SEAWEEDFS_S3_ENDPOINT: z.string().trim().min(1).default('localhost'),
    SEAWEEDFS_S3_PORT: z.coerce.number().int().positive().default(8333),
    SEAWEEDFS_S3_USE_SSL: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    // Development-only defaults match docker-compose. Deployments must override both credentials.
    SEAWEEDFS_S3_ACCESS_KEY: z.string().min(3).default('seaweedfsadmin'),
    SEAWEEDFS_S3_SECRET_KEY: z.string().min(8).default('seaweedfsadmin'),
    SEAWEEDFS_S3_BUCKET: z
      .string()
      .trim()
      .min(3)
      .max(63)
      .default('advisory-platform'),
    SEAWEEDFS_S3_REGION: z.string().trim().min(1).default('us-east-1'),
    // Omise
    OMISE_PUBLIC_KEY: z.string(),
    OMISE_SECRET_KEY: z.string(),
    CURRENCY_CODE: z.string().lowercase().default('thb'),
  })
  .superRefine((env, context) => {
    if (Boolean(env.SMTP_URL) !== Boolean(env.SMTP_FROM)) {
      context.addIssue({
        code: 'custom',
        message: 'SMTP_URL and SMTP_FROM must be configured together',
        path: env.SMTP_URL ? ['SMTP_FROM'] : ['SMTP_URL'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
