# Advisory Platform API

NestJS 11 backend for KMITL's Advisory Platform. The API uses Drizzle against the shared Supabase
Postgres and Better Auth cookie sessions. Every signup creates an Advisee; an authenticated Advisee
can explicitly create an Advisor profile. This repository contains only the API and its
infrastructure, contracts, tests, and delivery documentation; client applications are out of scope.

## Prerequisites

- Node.js 24
- Docker with Compose — for SeaweedFS and the test database, not the application's data
- Access to the Supabase project
- An `.env` copied from `.env.example`

Do not put real secrets in the repository. Set a random `BETTER_AUTH_SECRET` of at least 32
characters.

## Two databases

The distinction matters, because one of them is shared and the other is disposable.

| Variable            | Points at                | Who reads it                                          |
| ------------------- | ------------------------ | ----------------------------------------------------- |
| `DATABASE_URL`      | Supabase                 | the running API, `pnpm db:migrate`                     |
| `TEST_DATABASE_URL` | local Compose Postgres   | `pnpm test:integration`, `pnpm test:e2e`, `test:cov`   |

The suites `TRUNCATE`, `DROP TABLE` and `DELETE FROM user` to reach a clean slate, so they must
never see Supabase. `test/setup-test-env.ts` points `DATABASE_URL` at `TEST_DATABASE_URL` before
anything resolves it, and refuses to start if that value names a host other than localhost.

Use Supabase's **session** pooler (port 5432). The transaction pooler on 6543 hands out a different
backend per statement, which breaks the session-level advisory lock `drizzle-kit migrate` takes —
and would break booking creation's per-Advisor lock the same way. The connection string also needs
`uselibpqcompat=true`, or node-postgres reads `sslmode=require` as `verify-full` and fails on
Supabase's chain with `SELF_SIGNED_CERT_IN_CHAIN`.

Supabase publishes every table in `public` over PostgREST using the anon key by default. That door
is closed by `20260907141856_lock-down-postgrest-exposure`, which revokes the `anon` and
`authenticated` grants and enables RLS on every table. Authorization belongs to NestJS; nothing in
this repository reads PostgREST.

## Run locally

```bash
pnpm install
docker compose up -d      # SeaweedFS, and the Postgres the tests use
pnpm db:migrate           # against Supabase — DATABASE_URL
pnpm start:dev
```

The API listens on `http://localhost:3000` by default. Swagger is available at
`http://localhost:3000/api/v1/docs`; Better Auth routes under `/api/auth/*` are documented in
[`docs/api-spec.md`](docs/api-spec.md) because Swagger intentionally does not own them.

Local SeaweedFS runs the pinned single-node `weed mini` configuration. It serves private uploaded
objects through its S3 gateway at `http://localhost:8333`, pre-creates
`SEAWEEDFS_S3_BUCKET`, and uses the access key and secret from `.env`. Its filer UI is available at
`http://localhost:8888`; it is a file browser, not an administrative console. Both ports bind to
loopback only. Use the local development credentials from `.env.example` only. Override every
`SEAWEEDFS_S3_*` value with environment-managed credentials outside local development.
The Compose command includes an idempotent ownership repair so it can safely reuse the named volume
from the previous SeaweedFS configuration.

## Verify changes

```bash
pnpm build
pnpm lint
pnpm test --runInBand
pnpm test:integration
pnpm test:e2e
pnpm test:cov
```

`pnpm lint` is read-only; use `pnpm lint:fix` when you intentionally want automatic fixes.
`pnpm test:cov` needs the test database running and merges unit, integration, and e2e reports. CI
requires at least 80% for aggregate statements, branches, functions, and lines.

The test database needs the schema before the suites can use it. `db:migrate` follows
`DATABASE_URL`, so aim it at the test database explicitly — there is deliberately no script that
does this, because a script that picks a database for you is a script that eventually picks the
wrong one:

```bash
DATABASE_URL='postgresql://advisory:advisory@localhost:5432/advisory_platform' pnpm db:migrate
```

```powershell
$env:DATABASE_URL='postgresql://advisory:advisory@localhost:5432/advisory_platform'; pnpm db:migrate
```

## Documentation

- [`AGENTS.md`](AGENTS.md) — architecture and implementation rules
- [`docs/api-spec.md`](docs/api-spec.md) — HTTP contract and access rules
- [`docs/ER.mermaid`](docs/ER.mermaid) and [`docs/ER.README.md`](docs/ER.README.md) — data model
- [`docs/SPRINT-PLAN.md`](docs/SPRINT-PLAN.md) — current delivery baseline
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — implementation status and next work
- [`docs/dev-log.md`](docs/dev-log.md) — decision history
