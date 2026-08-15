import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { RoleResolver } from '@/common/authorization/role-resolver.service';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { Role } from '@/common/decorators/roles.decorator';
import type { Auth } from '@/modules/auth/auth.config';

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(() => new Headers()),
}));

import { SessionGuard } from './session.guard';

interface FakeAuthSession {
  user: { id: string; status: 'ACTIVE' | 'SUSPENDED' };
  session: { id: string };
}

describe('SessionGuard', () => {
  const userId = '11111111-1111-4111-8111-111111111111';
  let request: Partial<Request>;
  let getSession: jest.Mock;
  let resolveRoles: jest.Mock;
  let requiredRoles: Role[] | undefined;
  let isPublic: boolean;
  let guard: SessionGuard;

  function context(): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  function session(status: FakeAuthSession['user']['status']): FakeAuthSession {
    return {
      user: { id: userId, status },
      session: { id: 'session-id' },
    };
  }

  beforeEach(() => {
    request = { headers: {} };
    getSession = jest.fn();
    resolveRoles = jest.fn();
    requiredRoles = undefined;
    isPublic = false;

    const reflector = {
      getAllAndOverride: jest.fn((key: string) =>
        key === IS_PUBLIC_KEY ? isPublic : requiredRoles,
      ),
    } as unknown as Reflector;

    guard = new SessionGuard(
      { api: { getSession } } as unknown as Auth,
      { resolve: resolveRoles } as unknown as RoleResolver,
      reflector,
    );
  });

  it('does not authenticate a deliberately public route', async () => {
    isPublic = true;

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(getSession).not.toHaveBeenCalled();
  });

  it('rejects a protected route without a session', async () => {
    getSession.mockResolvedValue(null);

    const result = guard.canActivate(context());

    await expect(result).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(result).rejects.toThrow(
      'Authentication required. Please sign in to continue.',
    );
  });

  it('rejects a suspended account before resolving roles', async () => {
    getSession.mockResolvedValue(session('SUSPENDED'));

    const result = guard.canActivate(context());

    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    await expect(result).rejects.toThrow(
      'Account must be ACTIVE. Current status: SUSPENDED.',
    );
    expect(resolveRoles).not.toHaveBeenCalled();
  });

  it('accepts the implicit Advisee role without database role lookups', async () => {
    requiredRoles = [Role.Advisee];
    const activeSession = session('ACTIVE');
    getSession.mockResolvedValue(activeSession);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(resolveRoles).not.toHaveBeenCalled();
    expect(request.user).toBe(activeSession.user);
    expect(request.session).toBe(activeSession.session);
  });

  it('derives Advisor and Admin roles from profile rows', async () => {
    requiredRoles = [Role.Advisor];
    getSession.mockResolvedValue(session('ACTIVE'));
    resolveRoles.mockResolvedValue([Role.Advisee, Role.Advisor]);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(resolveRoles).toHaveBeenCalledWith(userId);
  });

  it('rejects an active user who lacks the required derived role', async () => {
    requiredRoles = [Role.Admin];
    getSession.mockResolvedValue(session('ACTIVE'));
    resolveRoles.mockResolvedValue([Role.Advisee]);

    const result = guard.canActivate(context());

    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    await expect(result).rejects.toThrow('Required role: ADMIN.');
  });

  it('lists every accepted role when a route allows alternatives', async () => {
    requiredRoles = [Role.Advisor, Role.Admin];
    getSession.mockResolvedValue(session('ACTIVE'));
    resolveRoles.mockResolvedValue([Role.Advisee]);

    await expect(guard.canActivate(context())).rejects.toThrow(
      'Required roles: ADVISOR or ADMIN.',
    );
  });
});
