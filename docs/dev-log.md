# Dev log

A running record of what changed and why, session by session — for picking this back up cold,
not a user-facing release log (that's a different document, if this project ever needs one).
Newest first. One entry per session with anything worth remembering; skip trivial sessions.

## 2026-08-11 — authorization baseline hardened and proven

- Added an explicit Better Auth endpoint contract to `docs/api-spec.md`. Auth responses are now
  documented as a deliberate exception to the Nest `/api/v1/*` response envelope.
- Restricted Better Auth's server-owned `status` and `avatarKey` fields with `input: false`. Signup
  always creates an `ACTIVE` Advisee and cannot set those fields from client input.
- Hardened `SessionGuard`: a valid session now needs an `ACTIVE` account. `SUSPENDED` and `DELETED`
  accounts receive 403 before role resolution.
- Replaced the S2 advisor-status stub with an atomic Advisee-to-Advisor upgrade endpoint and a real
  Advisor profile response. A repeat upgrade returns the contract's 409.
- Extracted production HTTP setup into `configureApp()` and added ESM-capable, cookie-preserving
  auth e2e tests. They prove 401, Advisor upgrade, role 403/allow, and suspended-account denial.
- Added deterministic repository ordering, update-time hooks for `modifiedAt` columns, graceful
  Postgres pool shutdown, and `noImplicitAny` TypeScript enforcement.
- Added a GitHub Actions workflow that migrates a disposable Postgres service and runs build, lint,
  unit coverage, integration, and auth e2e checks on pushes and pull requests. It reports coverage;
  the 80% aggregate gate remains intentionally pending until coverage is aggregated correctly.
- Expanded the auth contract with copy-paste JSON and curl examples for signup, sign-in, session,
  sign-out, and the Advisor upgrade request. The prior endpoint table alone was not actionable.
- Renamed the own-profile DTO from `AdvisorMeResponseDto` to `AdvisorOwnProfileResponseDto` to make
  its audience boundary explicit. Public discovery and admin lists will each get a separate response
  DTO rather than risking a field leak by reusing an ambiguous `AdvisorResponseDto`.

## 2026-08-10 — rebaselined delivery plan and Advisee-first accounts

- Added `docs/SPRINT-PLAN.md` as the repository's active planning baseline. It treats the supplied
  `SprintPlan(1).md` as historical input, preserves its dependencies, and marks inherited dates as
  provisional pending calendar confirmation.
- **Product decision:** signup always creates an Advisee. There is no role selector or onboarding
  wizard. An authenticated Advisee explicitly upgrades to Advisor by creating an advisor profile;
  identity/skill verification remains a separate trust process. The API specification, working
  guide, and Swagger wording now reflect this.
- Reprioritized S3 around auth proof: the e2e suite currently fails to load Better Auth's ESM build,
  and no auth/controller tests exist. Repairing that harness, documenting `/api/auth/*`, and testing
  cookie-session 401/403/allowed behavior come before later module work.
- Flagged a contract conflict for `POST /api/v1/advisors/me`: it cannot be both idempotent and
  return `409` when repeated. Resolve the intended repeat-upgrade behavior before implementation.

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
