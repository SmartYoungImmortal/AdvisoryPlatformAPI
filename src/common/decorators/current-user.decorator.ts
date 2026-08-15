import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { SessionUser } from '@/modules/auth/auth.config';

/**
 * How a handler gets the authenticated user. Never read `req.user` by hand.
 *
 * Typed non-optional: SessionGuard is global and runs before every non-`@Public()`
 * handler, populating `request.user` or throwing 401 first — a handler using this
 * decorator is, by construction, one SessionGuard has already let through.
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): SessionUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as SessionUser;
  },
);
