# Dev log

A running record of what changed and why, session by session — for picking this back up cold,
not a user-facing release log (that's a different document, if this project ever needs one).
Newest first. One entry per session with anything worth remembering; skip trivial sessions.

## 2026-08-08 — better-auth, Skills/Service-Categories modules, Swagger auth indicators

- **better-auth wired in**: `SessionGuard` (global `APP_GUARD`), `@Public`/`@Roles`/`@CurrentUser`,
  `user`/`session`/`account`/`verification` tables hand-written to match `@better-auth/core`'s
  canonical schema — `@better-auth/cli` (1.4.21) trails the installed core (1.6.26), so generate-
  then-edit was skipped in favor of getting the uuid shape right from the start. Full details in
  `CLAUDE.md`'s better-auth section.
- **Two CRUD modules** (`skills`, `service-categories`) as Swagger-testable examples — the only two
  pure-CRUD modules per `CLAUDE.md`'s "no `BaseCrudService`" note. Both verified live: public reads,
  403 for a signed-in non-admin write, 201 once promoted to admin.
- **Swagger cookie-auth lock icon, made automatic**: baked into `@ApiCreate`/`@ApiUpdate`/
  `@ApiDelete` (always) and `@ApiGetOne`/`@ApiGetPaginated` (default; opt out with
  `{ public: true }`) instead of added by hand per controller.
- **Fixed a real bug**: `TransformInterceptor` dropped the `data` key entirely when a handler
  returned `undefined` (a void `DELETE`) — `JSON.stringify` silently drops `undefined`-valued keys,
  breaking the envelope's "every response has the same three keys" contract. Now coerces to `null`.
- **Fixed a real gap**: `EntityRepository.findMany()` had no `limit`/`offset` support, despite every
  list endpoint needing pagination.
- **Moved `auth/` and `advisors/` under `src/modules/`** — `CLAUDE.md`'s layout already specified
  this; they'd just been built at the wrong level and needed correcting before it compounded.
