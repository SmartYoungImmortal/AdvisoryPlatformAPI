# Advisory Platform — Rebaselined Sprint Plan

**Rebaselined:** 2026-08-10  
**Status:** active planning baseline; dates inherited from `SprintPlan(1).md` must be confirmed
against the course calendar before they are treated as commitments.

This replaces the historical, personal `SprintPlan(1).md` for work in this repository. It keeps the
original dependency order and course-deliverable intent, but uses the repository as the source of
truth for completed work and known risks.

## Product decisions that now govern the plan

1. Every email/password signup creates an **Advisee**. There is no role-selection or onboarding
   flow at registration.
2. An Advisee becomes an **Advisor** only through the explicit, authenticated advisor-upgrade flow
   (`POST /api/v1/advisors/me` in the API contract). Creating `advisor_profiles` grants the Advisor
   role; identity and skill verification are separate trust checks, not a role-selection step.
3. Admin is never self-service. It remains a seeded/operational role.
4. AI features remain out of Project 1. Off-platform detection is rule-based.
5. A feature is not complete merely because it compiles: its endpoint contract and appropriate
   controller-level tests must exist.

## Reality check on the inherited plan

| Area | Original expectation | Actual repository state on 2026-08-10 | Planning consequence |
|---|---|---|---|
| S1/S2 foundation | Setup, auth, CI, 80% gate | Schema, better-auth, global guard, response envelope, and example CRUD modules exist. No CI workflow or coverage gate exists. | Treat foundation code as built, but keep quality automation unfinished. |
| Auth testing | Unit/integration coverage in S2/S3 | No auth controller tests; e2e test runner currently cannot load Better Auth's ESM module. | Finish the test harness before relying on auth for every later module. |
| Auth documentation | Login/register usable by frontend | `/api/auth/*` is intentionally excluded from Swagger and absent from the written API spec. | Publish a version-pinned auth contract now. |
| S3 account flow | Role selection + onboarding | Product decision supersedes this. | Build Advisee-first profile and explicit Advisor upgrade only. |

## Milestone plan

The dates below are the inherited weekly windows, marked provisional. The sequencing is the
important commitment.

| Sprint | Provisional window | Goal and required outcome |
|---|---|---|
| S3 | 8–14 Aug | Make auth observable and proven; deliver Advisee profile and explicit Advisor upgrade. |
| S4 | 15–21 Aug | Advisor discovery, public profiles, and advisor-owned service management. |
| S5 | 22–28 Aug | Booking with database-enforced no-overlap guarantee. |
| S6 | 29 Aug–4 Sep | Optional screening flow and payment/webhook lifecycle. |
| S7 | 5–11 Sep | Appointment/trial chat and notifications. |
| S8 | 12–18 Sep | Video-call access and authorized file storage. |
| S9 | 19–25 Sep | Rule-based trust & safety, admin operations, and PWA work. |
| S10 | 26 Sep–2 Oct | End-to-end integration, demo data, and feature freeze. |
| S11–S14 | 3–30 Oct | Functional/load/security testing, UAT, fixes, traceability, report, and presentation. |

## S3 — current sprint: account and authorization baseline

**Goal:** a person can sign up as an Advisee, maintain their own profile, deliberately upgrade to
Advisor, and the team can prove each authorization boundary with repeatable tests.

### In scope

- Repair the e2e test configuration for Better Auth ESM and ensure tests boot the application with
  the same middleware as production, including raw bodies at `/api/auth/*`.
- Document the version-pinned Better Auth endpoints used by this API: signup, signin, session, and
  signout. Include required extra user fields, cookie behavior, error shape, and frontend examples.
- Add cookie-preserving e2e tests for signup/signin, session lookup, protected-route 401, and
  signout.
- Add controller-level role tests: signed-in Advisee is denied an Admin action; seeded Admin is
  allowed; Advisor-only routes reject an Advisee before upgrade and allow them after it.
- Deliver own-profile read/update and avatar handling if the frontend contract is ready.
- Deliver `POST /api/v1/advisors/me` as an explicit Advisee-to-Advisor upgrade, creating the
  profile once and returning a documented repeat-upgrade result.
- Update the access matrix and response DTOs so they express the new rule, including account
  deletion/PDPA work if it fits the confirmed S3 capacity.

### Explicitly out of scope

- Role picker, onboarding wizard, or a default Advisor account.
- Advisor identity and skill verification UI/workflow beyond interfaces required by the upgrade.
- Admin self-promotion endpoint.

### S3 exit criteria

- Auth endpoints have a discoverable written contract, even if Better Auth remains excluded from
  Nest Swagger.
- The e2e suite runs and demonstrates the cookie session and 401/403/allowed boundaries.
- Signup always produces an Advisee; no code path asks a registrant to select a role.
- Advisor upgrade has a single documented repeat-request policy. **Resolve the existing contract
  conflict before implementation:** it currently calls the request “idempotent” but also says a
  second request returns `409`; both cannot be true.
- `npm run build`, relevant unit tests, integration tests, and e2e tests pass locally.

## Subsequent scope by dependency

### S4 — Discovery and advisor-owned services

Public advisor search/profile/reviews; skill and category use; advisor-owned service CRUD;
advisor profile fields; verification status/proof submission interfaces. Public data must follow the
field-level access table in `api-spec.md`.

### S5 — Booking

Timeslots, appointment state machine, cancellation rules, and the Postgres exclusion constraint.
Prove no double booking with a concurrent integration test; save that output as report evidence.

### S6 — Screening and payment

Screening stays optional and independent of the trial flow. Add payment intents/charges, webhook
signature verification and idempotency, invoice states, and confirmed booking only after payment.

### S7–S9 — fulfilment and trust

Chat/notifications, video/files, then rule-based off-platform detection, reports, admin review, and
PWA. Each stage depends on the earlier appointment and authorization model; do not pull it forward
without an integration path.

## Standing delivery rules

- One issue and a focused branch per task; preserve `main ← UAT ← develop ← feature/*`.
- Keep controller tests with endpoint changes and database integration tests for database guarantees.
- Record real test output/screenshots for report evidence as work is completed.
- Update `docs/api-spec.md`, `docs/dev-log.md`, and `docs/HANDOFF.md` in the same session when a
  contract or material decision changes.
- CI and the coverage strategy are priority debt, not completed process. Do not claim the 80% gate
  exists until a workflow actually enforces it.

## Risks to review weekly

| Risk | Mitigation |
|---|---|
| Auth is assumed secure but is untested | Fix the e2e harness first; test the guard through real controllers and cookies. |
| API contract drifts from Better Auth or frontend needs | Keep a concise, version-pinned auth reference and update it with configuration changes. |
| Booking/payments leave too little time for evidence | Implement database constraints and webhook tests in their assigned sprints, not at freeze. |
| CI/coverage becomes end-of-project work | Add CI after the auth suite is stable and make the report reflect measured coverage honestly. |
| Historical dates or course deadlines drift | Confirm the calendar at the next team/advisor review and edit the provisional dates here. |
