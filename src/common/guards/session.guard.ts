import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { RoleResolver } from '@/common/authorization/role-resolver.service';
import type { Auth } from '@/modules/auth/auth.config';
import { AUTH, AUTH_GUARD_MESSAGES } from '@/modules/auth/auth.constants';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { ROLES_KEY, Role } from '@/common/decorators/roles.decorator';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly roleResolver: RoleResolver,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authSession = await this.auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!authSession) {
      throw new UnauthorizedException(
        AUTH_GUARD_MESSAGES.authenticationRequired,
      );
    }

    if (authSession.user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        AUTH_GUARD_MESSAGES.inactiveAccount(authSession.user.status),
      );
    }

    request.user = authSession.user;
    request.session = authSession.session;

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Every authenticated account is an Advisee. Avoid two unnecessary role queries when
    // Advisee alone (or as one allowed role) already satisfies the route.
    if (requiredRoles?.length && !requiredRoles.includes(Role.Advisee)) {
      const userRoles = await this.roleResolver.resolve(authSession.user.id);
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          AUTH_GUARD_MESSAGES.requiredRoles(requiredRoles),
        );
      }
    }

    return true;
  }
}
