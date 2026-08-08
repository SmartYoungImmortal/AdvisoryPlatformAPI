# Handoff — where this stands right now

Snapshot as of 2026-08-08. For the history of how it got here, see `docs/dev-log.md`. For repo
conventions, see `CLAUDE.md` — read that before changing anything, not this file.

## State of the working tree

**There is uncommitted work on top of the last commit.** `629b17d` (committed 2026-08-08 08:25,
by Taj) captured the foundation up through the ER-derived Drizzle schema and docs/. Everything
below from "better-auth" onward — the whole auth module, `advisors`/`skills`/`service-categories`,
the Swagger lock-icon wiring, the `EntityRepository` pagination fix, the `TransformInterceptor`
`data: null` fix, and the `CLAUDE.md`/`docs/dev-log.md` updates describing them — is sitting in the
working tree, not committed. Check `git status` before assuming any of this is safe on disk beyond
this machine; commit it before pushing or switching branches.

## What's built and working

**S2 (Foundation + Auth), per `docs/sprint-plan.md` — done and proven live, not just compiled:**

- Docker Compose Postgres, typed env config (`zod`), the `DRIZZLE` client, and the full 31-table
  schema (28 ER tables + better-auth's `user`/`session`/`account`/`verification`) — migrated and
  applied to the local database.
- `common/`: `EntityRepository` (generic CRUD + pagination), `TransformInterceptor` +
  `AllExceptionsFilter` (response envelope), `OffsetPaginationDto`, the `@ApiGetOne` /
  `@ApiGetPaginated` / `@ApiCreate` / `@ApiUpdate` / `@ApiDelete` Swagger decorator set (now with
  automatic cookie-auth lock icons).
- better-auth: mounted at `/api/auth/*`, `SessionGuard` global (401 on no session, 403 on missing
  role), `@Public()` / `@Roles()` / `@CurrentUser()`. Advisor/Admin roles are derived from
  `advisorProfiles`/`adminProfiles`, not stored.
- **Exit criteria proven live**: `POST /api/auth/sign-up/email` → `GET /api/v1/advisors/me` returns
  401 with no session, 200 with one.

**Two extra modules, built as Swagger-testable CRUD examples** (not part of S2's own checklist, but
requested to have something to click through in `/api/docs`):

- `skills` and `service-categories` — the two modules `CLAUDE.md` names as genuinely pure CRUD.
  Public reads, admin-only writes. Verified live: anonymous GET works, a signed-in non-admin POST
  gets 403, promoting that user to admin (`INSERT INTO admin_profiles`) makes it 201.
- `advisors` currently holds only the `GET /me` proof-of-foundation stub — not the real Advisors
  module (search, public profile, onboarding, identity/skill verification), which is S3/S4 work.

## How to run it

```
docker compose up -d postgres      # first time, or after a reset
npm install
npm run db:migrate                 # applies src/database/migrations/
npm run start:dev                  # http://localhost:3000, Swagger at /api/docs
```

`.env` needs `DATABASE_URL` matching the compose file's Postgres credentials and a
`BETTER_AUTH_SECRET` (32+ chars). See `.env.example`.

**To test a protected write in Swagger or curl**: sign up via
`POST /api/auth/sign-up/email`, then (since there's no admin-promotion endpoint yet)
`INSERT INTO admin_profiles (user_id) VALUES ('<id>')` directly against the local Postgres.

## Verifying it

```
npm run build && npm run lint
npm run test:cov          # unit — 27 passing
npm run test:integration  # real Postgres — 7 passing
```

## Known gaps — not bugs, just not done yet

- **No CI.** S2's checklist item "lint + unit test + coverage gate 80%" was never started. There's
  also no `.github/workflows/`.
- **Coverage aggregation is unresolved.** `entity.repository.ts` and a few schema/config files show
  0% under `test:cov` because they're proven by `test:integration` or a live boot instead — real
  once CI tries to enforce the 80% gate across both runs. Flagged, not fixed.
- **`BETTER_AUTH_URL` isn't set.** better-auth logs a warning on boot and derives the origin from
  the incoming request instead. Harmless for local dev; worth setting before anything cross-origin.
- **Booking's no-overlap exclusion constraint is deliberately deferred to S5** — `serviceTimeslots`
  has a `TODO(S5)` comment, not the constraint itself. This is intentional, not a gap someone missed.
- **No admin-promotion endpoint.** The only way to create an admin right now is a manual `INSERT`.

## Next up, per `docs/sprint-plan.md`

**S3 · User Module**: onboarding (role selection), PDPA consent before signup, user profile API,
advisor profile, RBAC route guard (the pieces exist — `SessionGuard`, `@Roles` — this is applying
them to a real module), account deletion (right to be forgotten). Report #1 is due ~14 ส.ค., so this
is time-boxed.
