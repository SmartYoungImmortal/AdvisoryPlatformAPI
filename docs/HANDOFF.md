# Feature handoff — scheduling and public service discovery

## Branch and verification

Work is on `chore-remove-elasticsearch-and-smtp`. Public service discovery now queries Postgres
directly, and password-reset email delivery is not part of this API.

Run the standard verification after starting the required local database service:

```powershell
docker compose up -d postgres
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
