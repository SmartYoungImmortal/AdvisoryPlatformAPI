export const AUTH = Symbol('AUTH');

export const AUTH_GUARD_MESSAGES = {
  authenticationRequired:
    'Authentication required. Please sign in to continue.',
  inactiveAccount: (status: string) =>
    `Account must be ACTIVE. Current status: ${status}.`,
  requiredRoles: (roles: readonly string[]) =>
    `Required role${roles.length === 1 ? '' : 's'}: ${roles.join(' or ')}.`,
} as const;

/**
 * better-auth's default session cookie name. Used both to register the Swagger cookie
 * security scheme (main.ts) and to tag protected routes with it (api-docs.decorator.ts)
 * so the two can never drift apart into a lock icon that points at the wrong scheme.
 * Would need to change if `cookiePrefix` or the session cookie's own name is ever
 * customized in auth.config.ts.
 */
export const SESSION_COOKIE_NAME = 'better-auth.session_token';
