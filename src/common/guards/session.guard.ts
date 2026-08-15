import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import type { Auth } from '../../modules/auth/auth.config';
import { AUTH } from '../../modules/auth/auth.constants';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';
import { adminProfiles, advisorProfiles } from '../../database/schema';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
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
      throw new UnauthorizedException();
    }

    if (authSession.user.status !== 'ACTIVE') {
      throw new ForbiddenException();
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
      const userRoles = await this.resolveRoles(authSession.user.id);
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

      if (!hasRequiredRole) {
        throw new ForbiddenException();
      }
    }

    return true;
  }

  /**
   * Advisor/Admin aren't a stored column — they're derived from whether an
   * advisorProfiles/adminProfiles row exists for the user (docs/api-spec.md §2). An
   * advisor is still an advisee; the roles stack.
   */
  private async resolveRoles(userId: string): Promise<Role[]> {
    const roles: Role[] = [Role.Advisee];

    const [advisor, admin] = await Promise.all([
      this.db
        .select({ userId: advisorProfiles.userId })
        .from(advisorProfiles)
        .where(eq(advisorProfiles.userId, userId))
        .limit(1),
      this.db
        .select({ userId: adminProfiles.userId })
        .from(adminProfiles)
        .where(eq(adminProfiles.userId, userId))
        .limit(1),
    ]);

    if (advisor.length > 0) {
      roles.push(Role.Advisor);
    }
    if (admin.length > 0) {
      roles.push(Role.Admin);
    }

    return roles;
  }
}
