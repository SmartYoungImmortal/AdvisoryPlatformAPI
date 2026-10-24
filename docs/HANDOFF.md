# Feature handoff — scheduling and public service discovery

## Branch and verification

Public service discovery queries Postgres directly. Authentication email verification and password
reset use the configured SMTP transport. Local development uses Mailpit at `localhost:1025`, with
its inbox at `http://localhost:8025`. Production requires `SMTP_HOST` and `SMTP_FROM`; configure
`SMTP_USER` and `SMTP_PASSWORD` together when the provider requires authentication.

Run the standard verification after starting the local test database and Mailpit services:

```powershell
docker compose up -d postgres mailpit
pnpm run test:cov
```

## Scheduling and booking

The repository contains Global Availability, reusable Availability Profile, derived slot, and
booking APIs described in [`SPRINT-PLAN.md`](./SPRINT-PLAN.md). Slots are derived in the Advisor's
IANA timezone; bookings are locked per Advisor, revalidated under that lock, and protected by the
Postgres exclusion constraint.

## Public service discovery

`GET /api/v1/services` and `GET /api/v1/services/:serviceId` query Postgres directly. The list
supports `q`, `categoryId`, `advisorId`, `minPriceSatang`, `maxPriceSatang`, `page`, and `limit`.
Only published Services for active, non-banned Advisors are returned.

## Object storage

Local SeaweedFS is pinned to `chrislusf/seaweedfs:4.41` and runs the supported single-node `weed
mini` command. Compose passes `SEAWEEDFS_S3_ACCESS_KEY`, `SEAWEEDFS_S3_SECRET_KEY`, and
`SEAWEEDFS_S3_BUCKET` as SeaweedFS's standard AWS credential/bucket variables.
