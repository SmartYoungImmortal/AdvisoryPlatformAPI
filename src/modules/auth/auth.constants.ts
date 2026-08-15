export const AUTH = Symbol('AUTH');

/**
 * better-auth's default session cookie name. Used both to register the Swagger cookie
 * security scheme (main.ts) and to tag protected routes with it (api-docs.decorator.ts)
 * so the two can never drift apart into a lock icon that points at the wrong scheme.
 * Would need to change if `cookiePrefix` or the session cookie's own name is ever
 * customized in auth.config.ts.
 */
export const SESSION_COOKIE_NAME = 'better-auth.session_token';
