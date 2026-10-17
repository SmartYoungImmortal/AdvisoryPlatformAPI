import { validateEnv } from './env.schema';

function validConfig(overrides: Record<string, unknown> = {}) {
  return {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
    BETTER_AUTH_SECRET: 'a'.repeat(32),
    BETTER_AUTH_URL: 'http://localhost:4000',
    TRUSTED_ORIGINS: 'http://localhost:3000',
    OMISE_PUBLIC_KEY: '',
    OMISE_SECRET_KEY: '',
    ...overrides,
  };
}

describe('validateEnv SMTP settings', () => {
  it('accepts the local Mailpit defaults without authentication', () => {
    const env = validateEnv(validConfig());

    expect(env.SMTP_PORT).toBe(1025);
    expect(env.SMTP_SECURE).toBe(false);
    expect(env.SMTP_USER).toBeUndefined();
    expect(env.SMTP_PASSWORD).toBeUndefined();
  });

  it('requires a production SMTP host and sender address', () => {
    expect(() => validateEnv(validConfig({ NODE_ENV: 'production' }))).toThrow(
      'SMTP_HOST is required in production',
    );
    expect(() =>
      validateEnv(
        validConfig({ NODE_ENV: 'production', SMTP_HOST: 'smtp.example.test' }),
      ),
    ).toThrow('SMTP_FROM is required in production');
  });

  it('requires SMTP credentials to be configured as a pair', () => {
    expect(() =>
      validateEnv(validConfig({ SMTP_USER: 'mailer@example.test' })),
    ).toThrow('SMTP_USER and SMTP_PASSWORD must be configured together');
  });
});
