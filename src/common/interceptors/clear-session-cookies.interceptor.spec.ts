import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { AuthService } from '@thallesp/nestjs-better-auth';
import { lastValueFrom, of, throwError } from 'rxjs';
import type { Auth } from '@/modules/auth/auth.config';
import { ClearSessionCookiesInterceptor } from './clear-session-cookies.interceptor';

// The package ships ESM only; the interceptor needs nothing from it at runtime but
// the injection token, so a stand-in class keeps Jest's CommonJS transform happy.
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthService: class AuthService {},
}));

describe('ClearSessionCookiesInterceptor', () => {
  const authCookies = {
    sessionToken: {
      name: 'better-auth.session_token',
      attributes: { path: '/', httpOnly: true, secure: false, sameSite: 'Lax' },
    },
    sessionData: {
      name: 'better-auth.session_data',
      attributes: {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        domain: 'example.test',
      },
    },
  };
  let clearCookie: jest.Mock;
  let context: ExecutionContext;
  let interceptor: ClearSessionCookiesInterceptor;

  beforeEach(() => {
    clearCookie = jest.fn();
    context = {
      switchToHttp: () => ({ getResponse: () => ({ clearCookie }) }),
    } as unknown as ExecutionContext;
    const auth = {
      instance: { $context: Promise.resolve({ authCookies }) },
    } as unknown as AuthService<Auth>;
    interceptor = new ClearSessionCookiesInterceptor(auth);
  });

  it('expires every better-auth cookie with its own attributes, and passes the body through', async () => {
    const next: CallHandler = { handle: () => of({ id: 'deleted' }) };

    const body = await lastValueFrom(interceptor.intercept(context, next));

    expect(body).toEqual({ id: 'deleted' });
    expect(clearCookie).toHaveBeenCalledWith('better-auth.session_token', {
      domain: undefined,
      path: '/',
      secure: false,
      httpOnly: true,
      sameSite: 'lax',
    });
    expect(clearCookie).toHaveBeenCalledWith('better-auth.session_data', {
      domain: 'example.test',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
    });
  });

  it('leaves the cookies alone when the handler fails', async () => {
    const next: CallHandler = {
      handle: () => throwError(() => new Error('not deleted')),
    };

    await expect(
      lastValueFrom(interceptor.intercept(context, next)),
    ).rejects.toThrow('not deleted');
    expect(clearCookie).not.toHaveBeenCalled();
  });

  it('drops a sameSite value Express does not know and defaults the path', async () => {
    const auth = {
      instance: {
        $context: Promise.resolve({
          authCookies: {
            odd: { name: 'odd', attributes: { sameSite: 'sideways' } },
          },
        }),
      },
    } as unknown as AuthService<Auth>;
    const next: CallHandler = { handle: () => of(null) };

    await lastValueFrom(
      new ClearSessionCookiesInterceptor(auth).intercept(context, next),
    );

    expect(clearCookie).toHaveBeenCalledWith(
      'odd',
      expect.objectContaining({ path: '/', sameSite: undefined }),
    );
  });
});
