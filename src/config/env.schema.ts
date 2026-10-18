import { z } from 'zod';
import { Environment } from './environment.enum';

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(Environment).default(Environment.Development),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  FRONTEND_URL: z.url(),
  BACKEND_PUBLIC_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  SMTP_HOST: z.string().trim().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_USER: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional(),
  SMTP_PASSWORD: z
    .string()
    .transform((value) => value || undefined)
    .optional(),
  SMTP_FROM: z.string().trim().min(1).optional(),
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
});

export const envSchema = baseEnvSchema.superRefine((env, context) => {
  if (env.NODE_ENV === Environment.Production) {
    if (!env.SMTP_HOST) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_HOST'],
        message: 'SMTP_HOST is required in production',
      });
    }

    if (!env.SMTP_FROM) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_FROM'],
        message: 'SMTP_FROM is required in production',
      });
    }

    if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
      context.addIssue({
        code: 'custom',
        path: ['SMTP_USER'],
        message: 'SMTP_USER and SMTP_PASSWORD are required in production',
      });
    }
  }

  if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_PASSWORD'],
      message: 'SMTP_USER and SMTP_PASSWORD must be configured together',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
