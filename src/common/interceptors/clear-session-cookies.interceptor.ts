import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import type { CookieOptions, Response } from 'express';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import type { Auth } from '@/modules/auth/auth.config';

/**
 * Signs the browser out once the handler succeeds, by expiring every cookie
 * better-auth sets.
 *
 * For a route that ends the account's sessions server-side — deleting the account.
 * Deleting the `session` rows is not enough on its own: `auth.config.ts` caches the
 * session in a signed cookie for five minutes, so the guard keeps accepting that
 * cookie and the request fails later, at the authoritative permission check, as a
 * `403`. Nothing is exposed in that window, but the client is told "forbidden" for an
 * account that no longer exists and keeps a cookie that can never work again.
 * Expiring the cookies on the deletion's own response turns every later request from
 * that client into the `401` it should be.
 *
 * Cookie names and attributes come from better-auth's context, so a `__Secure-`
 * prefix or a cookie domain configured there is honoured here too.
 */
@Injectable()
export class ClearSessionCookiesInterceptor implements NestInterceptor {
  constructor(@Inject(AuthService) private readonly auth: AuthService<Auth>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      mergeMap(async (body: unknown) => {
        const { authCookies } = await this.auth.instance.$context;
        for (const { name, attributes } of Object.values(authCookies)) {
          response.clearCookie(name, cookieOptions(attributes));
        }
        return body;
      }),
    );
  }
}

/** better-auth's attributes, restated in the shape Express's `clearCookie` takes. */
function cookieOptions(attributes: {
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}): CookieOptions {
  const sameSite = attributes.sameSite?.toLowerCase();
  return {
    domain: attributes.domain,
    path: attributes.path ?? '/',
    secure: attributes.secure,
    httpOnly: attributes.httpOnly,
    sameSite:
      sameSite === 'strict' || sameSite === 'lax' || sameSite === 'none'
        ? sameSite
        : undefined,
  };
}
