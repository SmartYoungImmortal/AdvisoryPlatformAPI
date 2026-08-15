# Handoff

Current as of 2026-08-15. Use `git status` for the working-tree state and [`dev-log.md`](./dev-log.md)
for decision history. [`../AGENTS.md`](../AGENTS.md) is the implementation guide.

## What works

- NestJS runtime configuration, response envelope, validation filter, Swagger helpers, and typed
  environment validation.
- Drizzle/Postgres connection lifecycle and the canonical 31-table schema, with forward migrations.
- Better Auth at `/api/auth/*`, using raw request bodies and cookie sessions.
- A fail-closed global `SessionGuard`: public routes require `@Public()`, inactive accounts receive
  403, and Advisor/Admin roles are derived from profile rows.
- Written and copy-pasteable auth requests in [`api-spec.md`](./api-spec.md).
- Atomic `POST /api/v1/advisors/me` Advisee-to-Advisor upgrade and owner-only `GET /api/v1/advisors/me`.
- Owner-only `GET/PATCH /api/v1/users/me` for every authenticated account, including additive role
  membership, plus `PATCH /api/v1/advisors/me` for Advisor headline/bio updates.
- Public-read/Admin-write Skills and Service Categories sample modules.
- Unit, Postgres integration, and cookie-preserving auth e2e suites. CI merges their coverage and
  enforces at least 80% for aggregate statements, branches, functions, and lines.

The schema also enforces foundational data rules for nonnegative satang, positive durations,
trial-window consistency, 1–5 review stars, valid timeslot ranges, file size, and one invoice per
appointment. Better Auth lookup indexes and user-delete cascades exist for its session/account rows.

## Run and verify

```bash
npm install
docker compose up -d postgres
npm run db:migrate
npm run start:dev
```

Swagger is at `http://localhost:3000/api/docs`. Better Auth is not shown there; use the auth section
of [`api-spec.md`](./api-spec.md). Swagger intentionally does not offer a pasteable session-token
field: use Postman's cookie jar for API-only testing, or establish a real browser session first.

```bash
npm run build
npm run lint
npm test -- --runInBand
npm run test:integration
npm run test:e2e
npm run test:cov
```

## Known gaps

- The separately owned frontend contract is not mirrored here. Confirm it before designing
  frontend-dependent profile or discovery shapes.
- Avatar upload/removal, PDPA deletion, public advisor discovery, and Admin advisor listing are not
  implemented. Avatar work depends on the MinIO integration; the remaining views require
  audience-specific response DTOs.
- The database exclusion constraint preventing overlapping timeslots remains scheduled with the
  booking module; do not replace it with only an application-level check.
- Admin provisioning is operational/seeded; there is deliberately no self-promotion endpoint.

## Next work

Follow [`SPRINT-PLAN.md`](./SPRINT-PLAN.md): confirm the frontend contract, then implement S4 public
advisor discovery and advisor-owned service management. Keep public, owner, and Admin response DTOs
separate.
