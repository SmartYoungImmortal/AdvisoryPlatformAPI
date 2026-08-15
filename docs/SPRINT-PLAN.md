# Advisory Platform — Sprint Plan (Project 1)

**Updated:** 2026-08-12
**Status:** authoritative delivery plan. The old [`sprint.md`](./sprint.md) filename is retained
only as a redirect so existing editor tabs and links keep working.

> The dates are inherited from the original Project 1 schedule and remain provisional until the
> team confirms them with the course calendar. The order, scope boundaries, and delivery gates below
> are active now. Repository facts and API rules take precedence over historical task wording.

## 1. Planning rules and current facts

| Topic | Active rule |
|---|---|
| Sprint cadence | One week, Saturday–Friday; Saturday afternoon is review and planning for the next sprint. |
| Capacity | Plan about 30 feature-hours per sprint for the four-person team; reserve about 10 hours for meetings, reporting, and bugs. |
| Task tracking | One task in this plan equals one GitHub issue and focused `feature/*` branch. |
| Branching | `main ← UAT ← develop ← feature/*`. |
| Account model | Signup creates an Advisee only. Advisor access is the explicit authenticated upgrade; Admin is never self-service. |
| Quality | CI verifies build/lint and requires at least 80% across merged unit, integration, and e2e statements, branches, functions, and lines. |
| API contract | Confirm the separately owned frontend contract before inventing profile or onboarding behaviour. |
| AI | All AI work is Project 2. Project 1 uses rule-based ordering and detection only. |

### Delivered before the remaining S3 work

- S1/S2 foundation: Postgres/Drizzle schema, Better Auth, global `SessionGuard`, role decorators,
  response envelope, and Swagger-ready skills/service-category examples.
- Auth baseline: written Better Auth contract, cookie-preserving e2e coverage for signup/session,
  401, Advisor upgrade, role allow/deny, and suspended-account denial.
- Delivery automation: GitHub Actions runs build/lint and an aggregate unit, integration, and auth
  e2e coverage command with an enforced 80% threshold for all four metrics.

## 2. Timeline and course deliverables

| Sprint | Provisional window | Course deliverable | Phase |
|---|---|---|---|
| S1 | 25–31 Jul | — | Setup / POC — delivered baseline |
| S2 | 1–7 Aug | Progress report #1 (7 Aug) | Foundation — delivered baseline |
| S3 | 8–14 Aug | — | Account and authorization baseline |
| S4 | 15–21 Aug | — | Advisor discovery and services |
| S5 | 22–28 Aug | Progress report #2 (28 Aug) | Booking |
| S6 | 29 Aug–4 Sep | — | Screening and payment |
| S7 | 5–11 Sep | — | Chat and notifications |
| S8 | 12–18 Sep | Progress report #3 + 30% report draft (18 Sep) | Video and files |
| S9 | 19–25 Sep | — | Trust & safety, admin, PWA |
| S10 | 26 Sep–2 Oct | — | Feature freeze / integration |
| S11 | 3–9 Oct | Progress report #4 + 60% report draft (9 Oct) | Functional, load, security test |
| S12 | 10–16 Oct | — | UAT |
| S13 | 17–23 Oct | — | Fixes and traceability documents |
| S14 | 24–30 Oct | Report and presentation due (30 Oct) | Report and slides |
| — | 31 Oct–9 Nov | Presentation examination | Rehearsal and Q&A |

**Development completes at the end of S10.** S11–S14 are for testing, UAT, fixes, evidence,
documentation, and presentation — not new features.

## 3. WBS and dependency map

| WBS | Module / deliverable | Sprint |
|---|---|---|
| 4.1–4.4 | Environment, CI/CD, plan, test foundations | S1–S2 — delivered |
| 4.5–4.6 | User/account model and authentication | S2–S3 |
| 4.13 | Advisor discovery and service management | S4 |
| 4.7 | Appointment booking | S5 |
| 4.12 | Screening and payment | S6 |
| 4.8, 4.11 | Chat and notifications | S7 |
| 4.9, 4.10 | Video calls and file storage | S8 |
| 4.14 | Off-platform detection, reports, admin | S9 |
| 5.2–5.4 | Functional, load, security testing | S11 |
| 5.1 | User acceptance testing | S12 |
| 5.5 | Traceability, report, slides | S13–S14 |

Dependencies are deliberate: auth → discovery/services → booking → payment and fulfilment.
Video rooms and chat must be tied to appointments; off-platform detection depends on chat. Do not
pull work forward without its integration path.

## 4. Standing work and definition of done

- Meet the advisor weekly and keep a decision/note record.
- Hold sprint review/planning each Saturday; create the next sprint's GitHub issues.
- Write focused unit tests alongside endpoint work; add real-Postgres integration tests where a
  database invariant is promised.
- Update the traceability table and capture screenshots, test output, and measured results as work
  is completed.
- Keep `docs/api-spec.md`, `docs/dev-log.md`, and `docs/HANDOFF.md` aligned with material contract
  or implementation changes.

A task is done when it is merged to `develop`, its response DTO and authorization behavior are
documented, relevant tests pass, and report evidence is retained. The CI result must be green;
SonarQube is not a completion criterion unless it is actually configured and enforced.

## 5. Detailed sprint plan

### S1 · 25–31 Jul — Setup and POC (delivered baseline)

The historical POC and tool-selection sprint supplied the foundation for the repository. Preserve
the decisions that still matter: Better Auth owns `/api/auth/*`, PostgreSQL/Drizzle is the system of
record, and later Omise/Jitsi choices must be validated before their implementation sprints.

### S2 · 1–7 Aug — Foundation and authentication (delivered baseline)

Delivered: canonical schema and migrations, email/password authentication, session-protected API,
response envelope, test setup, CI verification, and enforced aggregate coverage.

### S3 · 8–14 Aug — Account and authorization baseline

**Goal:** prove that signup creates an Advisee, authorization boundaries are repeatable, and an
Advisee deliberately upgrades to Advisor.

**Delivered:** version-pinned auth documentation; cookie-preserving e2e coverage; suspended/deleted
account denial; explicit Advisor upgrade; 409 for repeat upgrade; and CI verification.

**Only remaining work if the frontend contract confirms it:**

| Area | Work |
|---|---|
| Profile | Own-profile read/update and avatar behavior, with separate allowlisted response DTOs. |
| PDPA | Account deletion/anonymization design and implementation consistent with the ER model. |
| Advisor profile | Add only the fields needed for S4 public discovery and advisor-owned services. |
| Tests | Cover each new controller boundary; do not reintroduce role selection or onboarding. |

**Exit criteria:** no registration path selects a role; repeat upgrade remains a documented `409`
policy; all account work uses the real application middleware and passes build, lint, relevant unit,
integration, and e2e verification.

### S4 · 15–21 Aug — Advisor discovery and service management (4.13)

**Goal:** an advisee can discover public advisors/services and an Advisor can manage only their own
services.

| Area | Work |
|---|---|
| Backend | Public advisor search/profile/reviews; skills/categories; advisor-owned service CRUD with satang pricing, duration, category, and pagination. |
| Authorization | Separate public, own-Advisor, and Admin DTOs; never expose full name, email, national ID, documents, or penalty points publicly. |
| Ranking | Rule-based category match, then rating/popularity; confirmed off-platform penalties rank down silently. |
| Performance | Measure discovery/search against the <3-second project QR and retain the result. |
| Testing | Controller authorization/ownership tests and discovery integration tests. |

### S5 · 22–28 Aug — Appointment booking (4.7)

**Goal:** booking works and double booking is impossible.

| Area | Work |
|---|---|
| Backend | Advisor timeslots, timezone-safe `timestamptz` handling, booking/cancel/reschedule state machine, and appointment views for both parties. |
| Guarantee | Add the Postgres exclusion constraint for overlapping live appointments; no application-only overlap check. |
| Testing | Concurrently book the same slot with multiple requests and prove exactly one succeeds; retain output as Success Criterion evidence. |
| Docs | Submit progress report #2 and record the state transitions in the API contract. |

### S6 · 29 Aug–4 Sep — Optional screening and payment (4.12)

**Goal:** screening, booking, payment, and confirmation have a correct lifecycle.

| Area | Work |
|---|---|
| Screening | Advisor-configured screening questions and advisee responses. Screening and free trial remain independent and optional. |
| Payment | Omise payment intent/charge flow, redirect/3DS as applicable, verified webhook signatures, idempotent webhook processing, invoices, and satang-only amounts. |
| Booking | An appointment starts pending payment and becomes confirmed only after a valid payment outcome. |
| Testing | Successful, failed, pending, delayed, and duplicate webhook cases; never charge or confirm twice. |

### S7 · 5–11 Sep — Chat and notifications (4.8, 4.11)

**Goal:** appointment/trial participants can communicate and receive timely events.

| Area | Work |
|---|---|
| Chat | Appointment/trial-bound rooms, member-only messages/history/read state, and measured realtime latency. |
| Notifications | Persist booking, payment, reminder, and message events with unread behavior. |
| Trial | Expose the optional trial path only where its screening/trial configuration permits it. |
| Evidence | Measure and retain chat latency against the project QR. |

### S8 · 12–18 Sep — Video calls and files (4.9, 4.10)

**Goal:** an authorized consultation can finish inside the platform.

| Area | Work |
|---|---|
| Video | Validate the Jitsi/hosted decision, create appointment-bound rooms, authorize only participants, and restrict access to the meeting window plus a small buffer. |
| Files | Member-authorized upload/download with MinIO object keys, 50 MB type/size enforcement, and no stored presigned URLs. |
| Evidence | Measure call quality against the applicable QR and retain the result. |
| Docs | Produce the 30% report draft from completed design and test evidence. |

### S9 · 19–25 Sep — Trust & safety, admin, and PWA (4.14)

**Goal:** retain platform safety evidence and give operations a minimal, authorized review path.

| Area | Work |
|---|---|
| Detection | Rule-based patterns for phone, email, LINE ID, and social handles, including basic evasion such as spaced phone numbers. |
| Operations | User reports, evidence-preserving flags, admin review/verification, and transaction views following the access matrix. |
| Ranking | Apply confirmed-advisor penalties silently; never disclose flags/points to the Advisor. |
| PWA | Manifest, offline shell, and install verification on a mobile device. |

### S10 · 26 Sep–2 Oct — Feature freeze and integration

**Goal:** freeze scope with two demonstrable end-to-end paths.

1. Advisee: discover → optional screening/trial → book → pay → chat → video call.
2. Advisor: upgrade/profile → create service → offer timeslot → receive booking → consult.

Complete bug bash, UAT deployment and demo seed data, critical technical-debt fixes, UAT scripts,
and honest coverage reporting. After this sprint, only defects and evidence/documentation work may
enter scope; incomplete features move to Project 2.

### S11 · 3–9 Oct — Functional, load, and security testing (5.2–5.4)

Create module test cases and results; run the planned load test (including the 1,000-concurrent-user
target if the test environment can support it); test authentication, authorization, encryption,
PDPA controls, and OWASP basics. Fix findings by severity and submit the 60% report draft.

### S12 · 10–16 Oct — User acceptance testing (5.1)

Recruit representative Advisors and Advisees, run the prepared script, collect satisfaction results
(target ≥80%) and unaided main-flow completion (target ≥90%), then prioritize necessary fixes.

### S13 · 17–23 Oct — Fixes and traceability documents

Fix necessary UAT findings. Complete CR → TC → QR → F → C → T traceability, House of Quality,
important QR specifications, function/component mapping, ER/use-case/sequence-diagram checks, and
the UAT-to-production release only after validation. CE Cloud publication and a short user guide are
optional bonus work.

### S14 · 24–30 Oct — Report and presentation

Finish and format the report, reserve advisor/coordinator review time, create the presentation, and
rehearse a 15-minute delivery. From 31 Oct to 9 Nov, rehearse at least three times, prepare answers
on architecture, overlap protection, testing, and PDPA, and keep a recorded demo as contingency.

## 6. Risks and explicit Project 2 boundary

| Risk | Mitigation |
|---|---|
| Frontend/API drift | Confirm the frontend contract before UI-dependent APIs; keep `api-spec.md` current. |
| Booking/payment evidence arrives late | Implement the database constraint and webhook tests in S5/S6, not at feature freeze. |
| Coverage regresses as modules grow | Keep focused unit/controller/database tests with each feature; CI enforces the aggregate 80% floor. |
| Jitsi or merchant onboarding delays | Make the hosting/payment decision early; use supported test/hosted paths where required. |
| Documentation is left to October | Capture results each sprint and draft the report from S8. |

Project 2: AI matching, consultation summaries/chatbot, semantic/ML detection, subscriptions,
native mobile apps, detailed review expansion, and automated advisor bank transfers. Project 1
records payout obligations but does not automate transfer execution.

## 7. Course-delivery checklist

- [ ] Maintain advisor-meeting records and submit all four progress reports.
- [ ] Keep ER at least 3NF and retain composite primary keys for junction tables.
- [ ] Complete use-case descriptions and component-level sequence diagrams.
- [ ] Finish report typography, paper setup, page numbering, and required format review.
- [ ] Use the available format-review opportunity before final submission.
- [ ] Maintain evidence for quality requirements and presentation/demo contingency.
