# Advisory Platform API

NestJS 11 backend for KMITL's Advisory Platform. The API uses Drizzle with self-hosted Postgres
and Better Auth cookie sessions. Every signup creates an Advisee; an authenticated Advisee can
explicitly create an Advisor profile. This repository contains only the API and its infrastructure,
contracts, tests, and delivery documentation; client applications are out of scope.

## Prerequisites

- Node.js 24
- Docker with Compose
- An `.env` copied from `.env.example`

Do not put real secrets in the repository. Set a random `BETTER_AUTH_SECRET` of at least 32
characters and keep `DATABASE_URL` aligned with the Docker Compose credentials.

## Run locally

```bash
npm install
docker compose up -d
npm run db:migrate
npm run start:dev
```

The API listens on `http://localhost:3000` by default. Swagger is available at
`http://localhost:3000/api/v1/docs`; Better Auth routes under `/api/auth/*` are documented in
[`docs/api-spec.md`](docs/api-spec.md) because Swagger intentionally does not own them.

Local SeaweedFS serves private uploaded objects through its S3 gateway at
`http://localhost:8333`. Its filer UI is available at `http://localhost:8888`; it is a file browser,
not an administrative console. Use the local development credentials from `.env.example` only.
Override every `SEAWEEDFS_S3_*` value with environment-managed credentials outside local development.

## Verify changes

```bash
npm run build
npm run lint
npm test -- --runInBand
npm run test:integration
npm run test:e2e
npm run test:cov
```

`npm run lint` is read-only; use `npm run lint:fix` when you intentionally want automatic fixes.
`npm run test:cov` needs Postgres and merges unit, integration, and e2e reports. CI requires at
least 80% for aggregate statements, branches, functions, and lines.

## Documentation

- [`AGENTS.md`](AGENTS.md) — architecture and implementation rules
- [`docs/api-spec.md`](docs/api-spec.md) — HTTP contract and access rules
- [`docs/ER.mermaid`](docs/ER.mermaid) and [`docs/ER.README.md`](docs/ER.README.md) — data model
- [`docs/SPRINT-PLAN.md`](docs/SPRINT-PLAN.md) — current delivery baseline
- [`docs/HANDOFF.md`](docs/HANDOFF.md) — implementation status and next work
- [`docs/dev-log.md`](docs/dev-log.md) — decision history
