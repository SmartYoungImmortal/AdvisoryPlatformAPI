// better-auth ships ES modules only, which this suite does not load; stood in for
// with just enough to build the options `createAuth` hands it.
jest.mock('better-auth/minimal', () => ({
  betterAuth: (options: unknown) => ({ options }),
}));
// The real lock hooks run in the ESM HTTP suite in test/app.e2e-spec.ts.
jest.mock('./login-lock', () => ({ loginLockHooks: () => ({}) }));
jest.mock('@better-auth/drizzle-adapter/relations-v2', () => ({
  drizzleAdapter: () => ({}),
}));
jest.mock('better-auth/plugins', () => ({ admin: () => ({ id: 'admin' }) }));
jest.mock('better-auth/plugins/access', () => ({
  createAccessControl: () => ({ newRole: () => ({}) }),
}));
jest.mock('better-auth/plugins/admin/access', () => ({
  adminAc: { statements: {} },
  userAc: { statements: {} },
  defaultStatements: {},
}));

import type { ConfigService } from '@nestjs/config';
import type { Env } from '@/config/env.schema';
import type { DrizzleDB } from '@/database/database.module';
import { authBaseURL, createAuth } from './auth.config';
import {
  afterUserCreated,
  beforeProviderAccountCreated,
  type UnverifiedPasswordStore,
} from './auth-hooks';

const newUser = { id: '11111111-1111-4111-8111-111111111111' };

/** Only what `createAuth` reads; nothing here connects anywhere. */
function stubConfig(): ConfigService<Env, true> {
  const values: Partial<Record<keyof Env, unknown>> = {
    BETTER_AUTH_SECRET: 'a-test-secret-that-is-long-enough-123',
    BETTER_AUTH_URL: 'http://localhost:3000',
    TRUSTED_ORIGINS: ['http://localhost:3001'],
    SMTP_PORT: 1025,
    SMTP_SECURE: false,
  };
  return {
    get: (key: keyof Env) => values[key],
  } as unknown as ConfigService<Env, true>;
}

describe('afterUserCreated', () => {
  it('hands the new account to the hook', async () => {
    const onUserCreated = jest.fn().mockResolvedValue(undefined);
    const logger = { error: jest.fn() };

    await afterUserCreated({ onUserCreated }, logger)(newUser);

    expect(onUserCreated).toHaveBeenCalledWith(newUser);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a failing hook and resolves, so sign-up still succeeds', async () => {
    const onUserCreated = jest
      .fn()
      .mockRejectedValue(new Error('notifications are down'));
    const logger = { error: jest.fn() };

    await expect(
      afterUserCreated({ onUserCreated }, logger)(newUser),
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(newUser.id),
      expect.stringContaining('notifications are down'),
    );
  });

  it('logs something that is not an Error as text', async () => {
    const onUserCreated = jest.fn().mockRejectedValue('timeout');
    const logger = { error: jest.fn() };

    await afterUserCreated({ onUserCreated }, logger)(newUser);

    expect(logger.error).toHaveBeenCalledWith(expect.any(String), 'timeout');
  });

  it('does nothing without a hook', async () => {
    const logger = { error: jest.fn() };

    await expect(
      afterUserCreated({}, logger)(newUser),
    ).resolves.toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('createAuth user hooks', () => {
  it("runs onUserCreated from better-auth's after-create hook for users", async () => {
    const onUserCreated = jest.fn().mockResolvedValue(undefined);
    const auth = createAuth({} as DrizzleDB, stubConfig(), { onUserCreated });

    const after = auth.options.databaseHooks?.user?.create?.after;
    expect(after).toEqual(expect.any(Function));
    await after?.(
      {
        ...newUser,
        email: 'new@example.test',
        emailVerified: false,
        name: 'New',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      null,
    );

    expect(onUserCreated).toHaveBeenCalledWith(
      expect.objectContaining(newUser),
    );
  });

  it('lets a provider join an account whose address was never verified', () => {
    const auth = createAuth({} as DrizzleDB, stubConfig());

    expect(
      auth.options.account?.accountLinking?.requireLocalEmailVerified,
    ).toBe(false);
    expect(auth.options.databaseHooks?.account?.create?.before).toEqual(
      expect.any(Function),
    );
  });
});

describe('authBaseURL', () => {
  const qa = 'https://qa.example.test';

  it('follows a local dev server that forwards to the deployed API, and nothing else', () => {
    expect(
      authBaseURL(qa, [qa, 'http://localhost:3000', 'http://127.0.0.1:3001']),
    ).toEqual({
      allowedHosts: ['localhost:3000', '127.0.0.1:3001'],
      protocol: 'http',
      fallback: qa,
    });
  });

  it('stays the public address when no loopback origin is trusted', () => {
    expect(authBaseURL(qa, [qa, 'https://www.example.test'])).toBe(qa);
  });

  it('keeps the cookies of the public origin on every address and reads the forwarded host', () => {
    const auth = createAuth({} as DrizzleDB, stubConfig());

    expect(auth.options.baseURL).toEqual({
      allowedHosts: ['localhost:3001'],
      protocol: 'http',
      fallback: 'http://localhost:3000',
    });
    expect(auth.options.advanced?.trustedProxyHeaders).toBe(true);
    expect(auth.options.advanced?.useSecureCookies).toBe(false);
  });
});

describe('beforeProviderAccountCreated', () => {
  const userId = newUser.id;

  function store(unverifiedPassword: boolean) {
    return {
      hasUnverifiedPassword: jest.fn().mockResolvedValue(unverifiedPassword),
      dropPassword: jest.fn().mockResolvedValue(undefined),
    } satisfies UnverifiedPasswordStore;
  }

  it('removes the unverified password, and its sessions, before Google joins the account', async () => {
    const passwords = store(true);
    const logger = { log: jest.fn() };

    await beforeProviderAccountCreated(
      passwords,
      logger,
    )({
      userId,
      providerId: 'google',
    });

    expect(passwords.hasUnverifiedPassword).toHaveBeenCalledWith(userId);
    expect(passwords.dropPassword).toHaveBeenCalledWith(userId);
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining(userId));
  });

  it('keeps the password of an account whose address is verified', async () => {
    const passwords = store(false);

    await beforeProviderAccountCreated(passwords, { log: jest.fn() })({
      userId,
      providerId: 'google',
    });

    expect(passwords.dropPassword).not.toHaveBeenCalled();
  });

  it('never touches a password account being created', async () => {
    const passwords = store(true);

    await beforeProviderAccountCreated(passwords, { log: jest.fn() })({
      userId,
      providerId: 'credential',
    });

    expect(passwords.hasUnverifiedPassword).not.toHaveBeenCalled();
    expect(passwords.dropPassword).not.toHaveBeenCalled();
  });

  it('stops the link when the password cannot be removed', async () => {
    const passwords = store(true);
    passwords.dropPassword.mockRejectedValue(new Error('database is down'));

    await expect(
      beforeProviderAccountCreated(passwords, { log: jest.fn() })({
        userId,
        providerId: 'google',
      }),
    ).rejects.toThrow('database is down');
  });
});
