# Feature handoff — scheduling, public search, and password reset

## Branch and verified checks

Work is on `feature/time-scheduling-booking`. `pnpm run build`, `pnpm run lint`, the unit suite
(25 suites, 135 tests), the integration suite (5 suites, 17 tests), and the e2e suite (3 suites,
16 tests) pass on this branch. The local Postgres migration set was applied successfully.

`pnpm run test:cov` executes all of those suites successfully but its final aggregate gate is still
red: 82.83% statements, 71.10% branches, 73.42% functions, and 82.02% lines. The repository target
is 80% for every metric, so branch/function coverage needs a separate, repo-wide test effort before
this handoff can be called coverage-green.

## Scheduling and booking

The branch contains the delivered Global Availability, reusable Availability Profile, derived slot,
and booking APIs described in [`SPRINT-PLAN.md`](./SPRINT-PLAN.md). Slots are derived in the
Advisor's IANA timezone; bookings are locked per Advisor, revalidated under that lock, and still
protected by the existing Postgres exclusion constraint.

The direct consequences for API consumers are:

- An authenticated Advisee can inspect `GET /api/v1/services/:serviceId/slots` before booking.
- A screened Service requires an accepted screening record before either slot discovery or booking.
- Booking/cancellation/rescheduling, multi-session, trial, and payment work remain scoped exactly
  as marked in the sprint plan; do not infer that they are complete.

## Object storage

Local SeaweedFS is pinned to `chrislusf/seaweedfs:4.41` and runs the supported single-node
`weed mini` command. Compose passes `SEAWEEDFS_S3_ACCESS_KEY`, `SEAWEEDFS_S3_SECRET_KEY`, and
`SEAWEEDFS_S3_BUCKET` as SeaweedFS's standard AWS credential/bucket variables. It pre-creates the
private bucket and binds its S3 gateway and filer UI to loopback on ports 8333 and 8888.

The named volume is preserved across the old and new setup. Before SeaweedFS drops privileges to its
runtime user, Compose idempotently repairs any root-owned child metadata the earlier setup left in
that volume. A real authenticated bucket check and put/get/delete cycle passed against the S3 gateway.

## Public service search

Run `docker compose up -d elasticsearch` before testing search. The local Compose service is bound
to `127.0.0.1:9200` and deliberately disables Elasticsearch security for local development only.
Production must use HTTPS and `ELASTICSEARCH_API_KEY`.
`ELASTICSEARCH_REQUEST_TIMEOUT_MS` defaults to 1000 so a missing optional local search service
cannot delay API startup; increase it deliberately for higher-latency production infrastructure.

`src/common/search/` owns the reusable typed client and immutable text/term/range query builder.
It has no controller and is explicitly imported by every feature that uses search. Each feature
owns its document mapping, indexing lifecycle, allowlisted filters, Postgres authorization recheck,
and HTTP routes. `AdvisorServicesModule` is the first consumer: `GET /api/v1/services` is public
and supports `q`, `categoryId`, `advisorId`,
`minPriceSatang`, `maxPriceSatang`, `page`, and `limit`. `GET /api/v1/services/:serviceId` is the
public detail. Only published Services for active, non-banned Advisors are returned. Elasticsearch
is rebuilt at application startup and synchronized after owner Service create/update/delete; every
search hit is then rechecked in Postgres to prevent stale-index disclosure.

`PublicServicesController` is only the HTTP adapter for the Services resource; its calls and search
index lifecycle live in the existing `AdvisorServicesService` and `AdvisorServicesRepository`.

If Elasticsearch is down, service writes remain successful but search returns `503` until the index
is available. Start Elasticsearch and restart the API to begin a background index rebuild.

## Password reset

Better Auth requires a `sendResetPassword` callback but leaves the delivery provider to the
application. This implementation uses SMTP, so set both values below to enable reset-email delivery;
leaving both unset deliberately disables the Better Auth reset-request endpoint without preventing
local API startup:

```dotenv
SMTP_URL=smtps://username:password@smtp.example.com:465
SMTP_FROM=no-reply@example.com
```

Use `POST /api/auth/request-password-reset` with `{ "email", "redirectTo" }`, where `redirectTo`
is one of `TRUSTED_ORIGINS`. Better Auth emails a one-time link; the frontend takes its token and
calls `POST /api/auth/reset-password` with `{ "token", "newPassword" }`. Tokens expire in one
hour and a successful reset revokes all existing sessions. The test suite uses a mail stub and does
not send real email.

## Remaining verification

Run these checks with the required local services whenever the schema changes:

```powershell
docker compose up -d postgres elasticsearch
pnpm run test:cov
```

The real-Postgres concurrent-booking integration test and cookie-preserving auth e2e suite have
passed locally. Do not claim the 80% aggregate coverage gate is satisfied until its branch/function
metrics are raised and this command exits successfully.
