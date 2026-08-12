# AdvisoryPlatformAPI — working guide

NestJS API for KMITL's Advisory Platform. This repository serves the separately owned
`AdvisoryPlatform/` Next.js frontend: when an endpoint's shape is unclear, follow the
frontend's actual needs. Do not invent product behaviour.

## Read before changing architecture

- `docs/api-spec.md` — API contract and field-level access rules. It is incomplete; only
  Advisors is a sample specification.
- `docs/ER.mermaid` and `docs/ER.README.md` — canonical data model and rationale.
- `docs/HANDOFF.md` — current implementation snapshot and known gaps.
- `docs/SPRINT-PLAN.md` — active delivery baseline; its dates remain provisional until confirmed.
- `docs/dev-log.md` — decisions that were made during prior sessions.

The frontend contract is not mirrored here. Ask before making a decision that depends on it.

## Architecture and invariants

- Stack: NestJS 11, Drizzle, self-hosted Postgres, better-auth. MinIO, Socket.IO, Jitsi,
  and Omise are planned integrations.
- Use UUID primary keys; every timestamp is `timestamptz`.
- Monetary values are integer satang, never floats or baht; name fields `*Satang`.
- No secrets, tokens, keys, or internal IPs in the repository. Use `.env.example` for names.
- `any` is forbidden. Prefer Drizzle inference; use `unknown` and narrow it at external
  boundaries.
- Junction tables have composite primary keys and no surrogate `id`.
- Booking overlap must ultimately be a Postgres exclusion constraint, not an app-level check.

## Code layout

- `src/common/` contains cross-cutting code only.
- `src/database/schema/` is central because the schema is one connected FK graph.
- Each feature lives in `src/modules/<feature>/` with controller, service, repository,
  module, DTOs, and focused tests.
- Controllers route, authorize, and document; services own business rules; repositories own
  Drizzle queries. A service must not import `drizzle-orm`.
- Do not introduce `shared/` or a generic `BaseCrudService`.
- Extend `EntityRepository` only for tables with an `id` column. For FK-primary-key tables,
  write a small plain repository with named queries.

## HTTP contract

- Non-auth API routes use `/api/v1/*`; better-auth owns `/api/auth/*`.
- Every response must retain the envelope:
  `{ statusCode, message, data }`. Use the global interceptor/filter; controllers return
  plain values and never use Express `res` directly.
- A response DTO is a whitelist. Do not return raw database rows.
- List routes use `OffsetPaginationDto` and return
  `{ items, total, page, limit, totalPages }`; maximum `limit` is 100.
- User-facing messages come from the module's `*.constants.ts`; reuse `crudMessages()` for
  ordinary CRUD text.
- Use the composed Swagger decorators (`ApiGetOne`, `ApiGetPaginated`, `ApiCreate`,
  `ApiUpdate`, `ApiDelete`) rather than repeating response declarations or manually adding the
  session-cookie security scheme.

## Authentication and authorization

- better-auth is mounted by `AuthController` at `/api/auth/*`; do not reimplement signup,
  signin, signout, or session endpoints in Nest.
- `SessionGuard` is a global `APP_GUARD`: routes are protected by default. Use `@Public()` only
  for deliberate exceptions, `@Roles(...)` for roles, and `@CurrentUser()` to access the session
  user. Never read `req.user` directly.
- `Advisor` and `Admin` roles are derived from `advisorProfiles` and `adminProfiles`. Every signup
  is an `Advisee`; there is no role-selection/onboarding wizard. Advisor status comes only from the
  explicit Advisee-to-Advisor upgrade flow; Admin is never self-service.
- Auth routes need the raw request body. `main.ts` deliberately skips Nest's JSON parser under
  `/api/auth`; preserve this routing when changing middleware.
- `TRUSTED_ORIGINS` drives both CORS and better-auth. CORS must retain `credentials: true` because
  sessions are cookies.
- The better-auth user table is the domain user table. Keep its UUID schema and `additionalFields`
  aligned with `src/database/schema/auth.ts`.

## Testing and delivery

- Run `npm run build`, `npm run lint`, and the relevant test suites before handoff.
- Unit tests are under `src/**/*.spec.ts`; database integration tests use
  `npm run test:integration`; e2e tests use `npm run test:e2e`.
- Coverage of at least 80% is a project requirement, but there is currently no CI gate and
  coverage is not aggregated across unit and integration suites. Treat this as unfinished work.
- The working tree may contain intentional uncommitted work. Inspect `git status` and preserve
  unrelated changes.
- Record substantive implementation decisions in `docs/dev-log.md` and update
  `docs/HANDOFF.md` when its snapshot changes.

## Auth verification baseline

Auth is documented and covered by real cookie-preserving e2e tests. Preserve this baseline whenever
auth or authorization changes:

- Swagger deliberately excludes `/api/auth/*`; maintain its written contract in `docs/api-spec.md`.
- E2e tests must use `configureApp()` so their middleware matches production, including the raw-body
  exception at `/api/auth/*`.
- Keep coverage for signup/session, 401, Advisor upgrade, 403/allowed roles, and suspended-account
  denial against a real database.

The aggregate 80% coverage gate and CI workflow remain unfinished; do not claim either exists until
they are implemented and enforced.
