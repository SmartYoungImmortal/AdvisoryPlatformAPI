# Advisory Platform — GitHub Issue Backlog Proposal

**Prepared:** 2026-08-29
**Status:** Rebased after the 22 August meeting and repository audit; no GitHub issues have been created from this file.
**Scope:** Remaining Project 1 API and course-delivery work for `AdvisoryPlatformAPI` from S4
through S14.

## 1. How to review this proposal

This backlog is derived from the implemented modules, the canonical ER model, the API access
matrix, the 22 August meeting summary, and the active sprint plan. S1 through S3 are delivered and
must not be created as new issues.

Before creating GitHub issues, the team should verify:

- the issue boundaries and point estimates;
- the provisional sprint dates against the course calendar;
- the API contract decisions called out in AP-002;
- the scope of the already completed Omise and self-hosted Jitsi integration decisions;
- whether optional P3 items remain inside Project 1 capacity.

No issue below authorizes behavior outside the documented product scope. Unspecified behavior must
be resolved in the API contract rather than invented during implementation.

### Current implementation audit

Verified against registered Nest modules, controllers, tests, migrations, the meeting-summary
alignment commit, and `SPRINT-PLAN.md` on 2026-08-29. This is a repository audit: a report or
evidence held outside the repository is not treated as complete until it is linked here.

| Classification                                         | Issue IDs                                                                                                                                                      | Verification result                                                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Delivered prerequisites — excluded from new issues     | AP-005, AP-010; Avatar storage; Socket.IO/chat core; Omise setup; self-hosted Jitsi setup                                                                      | AP-005 and AP-010 were implemented on `feature/time-scheduling-booking`; their entries below are retained only for traceability. |
| Partially prepared — remaining issue scope is not done | AP-002, AP-009, AP-011–AP-012, AP-014, AP-018, AP-021–AP-022, AP-035–AP-037, AP-046, AP-051, AP-062                                                            | The implementation or evidence is partial; use each issue's current status below rather than its original proposal wording.      |
| Not implemented                                        | AP-003–AP-004, AP-006–AP-008, AP-013, AP-015, AP-017, AP-019–AP-020, AP-023, AP-025, AP-028–AP-030, AP-032–AP-034, AP-038–AP-045, AP-047–AP-050, AP-052–AP-067 | No matching completed workflow/evidence exists. Canonical schema tables alone do not count as an implemented feature.            |
| Recurring                                              | AP-068                                                                                                                                                         | Create one issue for each future sprint; prior governance activity does not complete future copies.                              |

This audit prevents completed work from being created again and distinguishes reusable foundations
from finished features. Re-run it immediately before writing issues to GitHub in case the working
tree changes.

## 2. Planning conventions

### Priority

| Priority | Meaning                                                                           |
| -------- | --------------------------------------------------------------------------------- |
| P0       | Release or evidence blocker; the sprint goal cannot be achieved without it.       |
| P1       | Project 1 must-have product or quality work.                                      |
| P2       | Important supporting work that may be rescheduled without breaking the core flow. |
| P3       | Optional bonus or polish; remove first if capacity is constrained.                |

### Story points

Fibonacci points are relative complexity, uncertainty, and testing effort—not hours:

| Points | Guidance                                                                       |
| ------ | ------------------------------------------------------------------------------ |
| 1      | Very small, known documentation or configuration change.                       |
| 2      | Small and well understood.                                                     |
| 3      | Focused change with tests or coordination.                                     |
| 5      | Medium feature spanning controller/service/repository or an external boundary. |
| 8      | Complex workflow, concurrency, security, or multi-module integration.          |

An issue estimated above 8 points should be split before implementation. Each implementation issue
inherits the repository definition of done: allowlisted response DTOs, authorization and ownership
coverage, unit/integration/e2e tests as appropriate, passing build/lint, and aligned API/handoff/dev
documentation.

### Dependency notation

`None` means the issue can start from the delivered baseline. `Delivered baseline` means it depends
only on code documented as complete in the current implementation audit. References such as
`AP-012` are blocking issue dependencies, not merely related work.

## 3. Issue inventory

## S4 — advisor discovery and service management

### AP-002 — Finalize the API contract for discovery, profiles, and services

- **Description:** Define discovery, advisor-detail, service, filter, pagination, and public-avatar
  request/response behavior from the documented product, privacy, and access rules. Record the
  contract and any unresolved product decisions in `docs/api-spec.md` before implementation begins.
- **Inputs needed:** Provide the frontend repository/path or its discovery screens, TypeScript
  types, API client calls, and expected empty/error states. The team must confirm service route
  layout, list-card/detail fields, public avatar delivery, filters/default ordering, owned-service
  create/update fields, and publish/unpublish behavior. Advisor list/detail shapes are already
  drafted; service and public-avatar behavior are not final.
- **Priority:** P0
- **Sprint:** S4
- **Story points:** 3
- **Dependencies:** None
- **Target:** API repository
- **Status:** Partially complete; the existing Advisor draft is usable, but the service and public-avatar contract still require confirmation.

### AP-003 — Implement advisor-owned claimed-skill replacement

- **Description:** Add `PUT /api/v1/advisors/me/skills` using a plain repository for the composite-key
  junction. Advisors search and select existing skills first; claims have no public proof level or
  verification badge. Prevent unknown skill IDs, and ensure removing/re-adding a claim never
  restores an old optional proof document.
- **Priority:** P1
- **Sprint:** S4
- **Story points:** 5
- **Dependencies:** AP-002; delivered Skills and Advisor modules
- **Target:** API repository
- **Status:** Proposed

### AP-004 — Implement advisor-owned service CRUD

- **Description:** Add owner-only create, list, read, update, publish/unpublish, and delete endpoints
  for services. Enforce ownership, integer-satang pricing, positive duration, category validity,
  independent screening/trial switches, pagination, focused DTOs, and returned-resource DELETE
  behavior.
- **Priority:** P0
- **Sprint:** S4
- **Story points:** 8
- **Dependencies:** AP-002; delivered Service Categories and Advisor modules
- **Target:** API repository
- **Status:** Proposed

### AP-005 — Implement public service search and service detail

- **Description:** Add public paginated service search/detail endpoints for published services only,
  with agreed category, price, text, and advisor filters. Exclude suspended/deleted advisors and
  private owner fields; return 404 when a resource must not be disclosed.
- **Priority:** P1
- **Sprint:** S4
- **Story points:** 5
- **Dependencies:** AP-002, AP-004
- **Target:** API repository
- **Status:** Delivered on `feature/time-scheduling-booking` — public Postgres-backed search and
  detail routes enforce published, active, non-banned Advisor visibility. Ranking remains AP-006
  work.

### AP-006 — Implement ranked public advisor search

- **Description:** Add `GET /api/v1/advisors` with the documented pagination and filter contract.
  Compute rule-based ordering from category match, rating, popularity, and the existing private
  penalty score; derive verification badges and minimum prices without leaking protected fields or
  penalty information.
- **Priority:** P0
- **Sprint:** S4
- **Story points:** 8
- **Dependencies:** AP-002, AP-003, AP-004
- **Target:** API repository
- **Status:** Proposed

### AP-007 — Implement public advisor detail and review listing

- **Description:** Add public advisor detail and paginated review endpoints. Expose only display
  identity, headline/bio, claimed skills, identity-verification badge, rating summary, published services, and
  reviewer display names; hide inactive or never-published advisors with 404 responses.
- **Priority:** P1
- **Sprint:** S4
- **Story points:** 5
- **Dependencies:** AP-002, AP-003, AP-004
- **Target:** API repository
- **Status:** Proposed

### AP-008 — Prove discovery authorization, ranking, and response performance

- **Description:** This issue does not build another endpoint. After AP-005 through AP-007 are
  implemented, add database-backed tests for guest access, public-versus-owner DTO separation,
  filters, pagination, deterministic ranking, hidden/inactive Advisors, and service ownership
  failures. Then seed a representative dataset, measure discovery/search against the under-three-
  second quality requirement, and retain the command, environment, dataset size, and result as
  evidence.
- **Priority:** P1
- **Sprint:** S4
- **Story points:** 5
- **Dependencies:** AP-005, AP-006, AP-007
- **Target:** API repository
- **Status:** Proposed

## S5 — appointment booking

### AP-009 — Specify booking states, transition rules, and HTTP contract

- **Description:** Finalize the derived-slot, booking, cancellation, rescheduling, and party-view API
  contract. Document actor permissions, payment-gated states, timezone behavior, allowed
  transitions, conflict responses, and what is returned after each mutation. Resolve the agreed
  multiple-session-in-one-checkout behavior without weakening the one-invoice-per-appointment
  invariant or inventing client-managed slot records.
- **Priority:** P0
- **Sprint:** S5
- **Story points:** 3
- **Dependencies:** AP-002, AP-004
- **Target:** API repository and API documentation
- **Status:** Partially prepared; schema enums and ER rationale exist, but HTTP transitions and actor behavior are not finalized.

### AP-010 — Implement Advisor Global Availability, Profiles, and derived Advisee slots

- **Description:** Add the one Advisor Global Availability configuration plus Advisor-owned
  create/list/update/block/soft-delete operations for reusable Availability Profiles, weekly
  windows, specific-date windows, and full/partial blocked periods. Derive authenticated
  30-minute Advisee slots;
  blocked periods override specific and weekly windows. Use `timestamptz` for appointments,
  validate ownership/future ranges, and derive booked status rather than storing client-managed
  timeslots.
- **Priority:** P0
- **Sprint:** S5
- **Story points:** 5
- **Dependencies:** AP-004, AP-009
- **Target:** API repository
- **Status:** Implemented on `feature/time-scheduling-booking`: module, typed HTTP responses,
  timezone-safe derivation, screening gate, global/per-Service daily limits, buffer handling, and
  focused unit tests exist. Profile responses include their weekly, specific-date, and blocked
  windows. Inline Profile creation/automatic naming remains outside this issue's delivered HTTP
  shape and is tracked in the sprint-plan gap table.

### AP-011 — Enforce non-overlapping live bookings in PostgreSQL

- **Description:** Apply and verify the required raw SQL migration using a PostgreSQL exclusion
  constraint so an Advisor cannot hold overlapping availability-blocking appointments across their
  services. Define the participating rows through `blocksAvailability`, map constraint failures to
  stable conflicts, and prove the invariant directly against Postgres.
- **Priority:** P0
- **Sprint:** S5
- **Story points:** 8
- **Dependencies:** AP-009, AP-010
- **Target:** API repository
- **Status:** Implementation prepared: the raw migration enables `btree_gist`, booking maps `23P01`
  to a stable HTTP 409, and a concurrent real-Postgres integration spec now asserts exactly one
  insert succeeds. The local evidence run is still pending because the test Postgres service was
  unavailable in the implementation environment.

### AP-012 — Implement atomic booking creation and party-specific appointment views

- **Description:** Allow an Advisee to book eligible open availability in an atomic transaction,
  create `PENDING_PAYMENT` appointments (including the documented multi-session checkout once
  AP-009 defines its atomic semantics), and provide paginated own-booking views for Advisee and
  Advisor participants. Reject self-booking, hidden services, unauthorized reads, and consumed
  availability without disclosing other users' bookings.
- **Priority:** P0
- **Sprint:** S5
- **Story points:** 8
- **Dependencies:** AP-009, AP-010, AP-011
- **Target:** API repository
- **Status:** Partially implemented: authenticated single-session atomic booking and both
  participant views exist. The per-Advisor transaction lock rechecks eligibility before insert.
  Multi-session atomic semantics remain blocked on AP-009, and payment/state transitions remain
  separate work.

### AP-013 — Implement cancellation, rescheduling, and appointment state transitions

- **Description:** Implement party-authorized cancellation, Advisor status updates, and atomic
  rescheduling. A reschedule is cancellation followed by a new booking/refund flow; the original
  range reopens only when the remaining time still meets minimum booking notice. Advisor-originated
  cancellation also creates the behavior-penalty input. Reject illegal/stale transitions and
  preserve auditable appointment history.
- **Priority:** P1
- **Sprint:** S5
- **Story points:** 8
- **Dependencies:** AP-011, AP-012
- **Target:** API repository
- **Status:** Proposed

### AP-014 — Prove booking concurrency and timezone behavior

- **Description:** Add integration/e2e tests that submit simultaneous bookings for the same or
  overlapping availability and prove exactly one succeeds. Cover timezone offsets, stable
  `timestamptz` serialization, daily consultation limits (excluding buffer), and state conflicts.
  Daylight-saving-time special handling is explicitly out of Project 1 scope.
- **Priority:** P0
- **Sprint:** S5
- **Story points:** 5
- **Dependencies:** AP-011, AP-012
- **Target:** API repository
- **Status:** Partially implemented: timezone conversion, invalid timezone/date handling, buffer,
  daily-limit, screening, and slot-range unit tests pass. The real-Postgres concurrent constraint
  spec is written but could not run locally without the test database; broader state-conflict
  integration/e2e evidence remains outstanding.

### AP-015 — Submit progress report #2 with booking evidence

- **Description:** Update the traceability record and progress report with the implemented booking
  contract, state diagram, database constraint, concurrent-request result, coverage, risks, and
  sprint decisions. Use measured evidence rather than projected results.
- **Priority:** P1
- **Sprint:** S5
- **Story points:** 3
- **Dependencies:** AP-014
- **Target:** Course deliverable
- **Status:** Outstanding; no Progress report #2 or booking evidence artifact was found in this repository on 2026-08-29. Link an externally stored submission here if it exists; do not manufacture projected evidence.

## S6 — screening, payment, refunds, and payout records

### AP-017 — Implement advisor-owned screening question management

- **Description:** Add ordered screening-question CRUD under an Advisor's own services. Enforce
  service ownership, stable display order, focused subresource DELETE responses, and correct
  behavior when screening is disabled or a question already has retained answers.
- **Priority:** P1
- **Sprint:** S6
- **Story points:** 5
- **Dependencies:** AP-004, AP-009
- **Target:** API repository
- **Status:** Proposed

### AP-018 — Implement screening submission, review, and direct Trial grants

- **Description:** Let Advisees submit answers for services that require screening and let the
  owning Advisor accept or decline them with a reason. Keep screening independent from Trial:
  a Trial is a direct Advisor grant (not a request/approval state), is limited to one per
  Advisee/service, and only then permits selection of a Trial time. Expose only participant-
  appropriate views.
- **Priority:** P0
- **Sprint:** S6
- **Story points:** 8
- **Dependencies:** AP-017
- **Target:** API repository
- **Status:** Partially prepared; the screening and direct Trial-grant tables exist, but no workflow endpoint, authorization, or lifecycle tests exist.

### AP-019 — Create payment intents and immutable invoice amounts for bookings

- **Description:** Create one invoice per appointment using a server-side snapshot of service price
  and platform fee in satang, initiate the Omise payment flow, and return only safe provider/client
  fields. Keep the appointment pending until a verified provider outcome arrives and prevent a
  second charge from repeated client requests.
- **Priority:** P0
- **Sprint:** S6
- **Story points:** 8
- **Dependencies:** AP-012; delivered Omise integration prerequisite
- **Target:** API repository
- **Status:** Proposed

### AP-020 — Process signed payment webhooks idempotently

- **Description:** Add the public Omise webhook boundary with raw-body/signature verification,
  event deduplication, transactional invoice and appointment transitions, safe logging, and stable
  handling for successful, failed, pending, delayed, reordered, and repeated events.
- **Priority:** P0
- **Sprint:** S6
- **Story points:** 8
- **Dependencies:** Delivered Omise integration prerequisite; AP-019
- **Target:** API repository
- **Status:** Proposed

### AP-021 — Implement participant invoice views and refund cases

- **Description:** Add own invoice reads, participant refund requests with a written reason and
  zero or more evidence files, and Admin review decisions using the access matrix. Require
  appointment cancellation before the Omise refund, enforce relationship/decision checks and
  idempotency, and synchronize invoice status.
- **Priority:** P1
- **Sprint:** S6
- **Story points:** 8
- **Dependencies:** AP-020
- **Target:** API repository
- **Status:** Partially prepared; refund-evidence and payout/bank-account schema fields exist, but no endpoint, provider workflow, or authorization tests exist.

### AP-022 — Implement payout obligation records and Admin transaction views

- **Description:** Record Advisor payout obligations from invoices eligible seven days after a
  completed consultation, link them through the composite-key junction, and expose own-Advisor and
  Admin views. Require the Advisor bank account number, account name, and bank name; record the
  2,000-satang transfer fee on each payout. Support manual Admin status recording only; automated
  bank transfer remains explicitly outside Project 1.
- **Priority:** P2
- **Sprint:** S6
- **Story points:** 5
- **Dependencies:** AP-020
- **Target:** API repository
- **Status:** Partially prepared; refund-evidence and payout/bank-account schema fields exist, but no endpoint, provider workflow, or authorization tests exist.

### AP-023 — Prove screening and payment lifecycle correctness

- **Description:** Add real-database and e2e coverage for optional screening combinations, trial
  eligibility, price snapshots, successful/failed/pending payments, bad signatures, delayed and
  duplicate webhooks, refunds, and double-charge/double-confirmation prevention.
- **Priority:** P0
- **Sprint:** S6
- **Story points:** 5
- **Dependencies:** AP-018, AP-020, AP-021, AP-022
- **Target:** API repository
- **Status:** Proposed

## S7 — chat, trial rooms, and notifications

### AP-025 — Provision appointment and trial chat rooms atomically

- **Description:** Create chat rooms and composite-key memberships only for the two authorized
  appointment participants or a directly granted Trial. Make provisioning idempotent and prevent
  arbitrary room creation or membership changes. Once created, member chat is available at all
  times rather than only during a consultation window.
- **Priority:** P0
- **Sprint:** S7
- **Story points:** 5
- **Dependencies:** AP-012, AP-018; delivered Socket.IO/chat core
- **Target:** API repository
- **Status:** Proposed

### AP-028 — Implement persistent notification inbox and event creation

- **Description:** Add owner-only paginated notification reads, unread totals, mark-one/mark-all
  read operations, and internal creation for booking, payment, new-message, screening, and later
  verification/safety events. Make retries safe and do not expose another user's notification data.
- **Priority:** P1
- **Sprint:** S7
- **Story points:** 5
- **Dependencies:** AP-013, AP-020, AP-018; delivered Socket.IO/chat core
- **Target:** API repository
- **Status:** Proposed

### AP-029 — Implement idempotent appointment reminders

- **Description:** Schedule `SESSION_REMINDER` notifications for booked appointments using a
  restart-safe, duplicate-safe mechanism. Cancel or ignore reminders for cancelled/rescheduled
  appointments and document the API's timezone and timestamp responsibilities.
- **Priority:** P2
- **Sprint:** S7
- **Story points:** 5
- **Dependencies:** AP-013, AP-028
- **Target:** API repository
- **Status:** Proposed

### AP-030 — Prove chat authorization, reconnect behavior, and latency

- **Description:** Add e2e tests for socket-cookie authentication, participant isolation, expired
  trials, persistence, reconnects, ordering, and unread updates. Measure realtime delivery latency
  against the project quality requirement and retain reproducible evidence.
- **Priority:** P0
- **Sprint:** S7
- **Story points:** 5
- **Dependencies:** AP-025; delivered Socket.IO/chat core
- **Target:** API repository
- **Status:** Proposed

## S8 — video and object-backed files

### AP-032 — Implement appointment-bound video room access

- **Description:** Generate unpredictable appointment-bound room names and grant join information
  only to active appointment participants during the documented time window plus a small buffer.
  Deny cancelled, unauthorized, too-early, and expired access without exposing room details.
- **Priority:** P0
- **Sprint:** S8
- **Story points:** 8
- **Dependencies:** AP-013; delivered self-hosted Jitsi integration prerequisite
- **Target:** API repository
- **Status:** Proposed

### AP-033 — Implement member-authorized chat file upload and download

- **Description:** Add chat-file multipart upload, metadata persistence, and short-lived download
  URLs through the shared storage boundary. Enforce membership, allowed types, the schema's 50 MB
  limit, opaque keys, expiry behavior, and safe cleanup after partial failures.
- **Priority:** P1
- **Sprint:** S8
- **Story points:** 8
- **Dependencies:** Delivered SeaweedFS storage and Socket.IO/chat prerequisites; AP-025
- **Target:** API repository
- **Status:** Proposed

### AP-034 — Implement service image management

- **Description:** Add Advisor-owned service image upload, ordered carousel replacement/removal, and
  public short-lived retrieval URLs. Enforce service ownership, image validation, composite-key
  ordering, cleanup, and no persisted presigned URLs.
- **Priority:** P2
- **Sprint:** S8
- **Story points:** 5
- **Dependencies:** Delivered SeaweedFS storage prerequisite; AP-004
- **Target:** API repository
- **Status:** Proposed

### AP-035 — Implement secure Advisor identity submission

- **Description:** Add multipart identity submission with Thai national-ID checksum validation,
- non-reversible lookup hashing for uniqueness, authenticated encryption at rest, SeaweedFS document storage, safe
  resubmission rules, and a status-only response. Never log, return, or use plaintext national IDs
  as identifiers.
- **Priority:** P0
- **Sprint:** S8
- **Story points:** 8
- **Dependencies:** Delivered SeaweedFS storage prerequisite; AP-002
- **Target:** API repository
- **Status:** Partially prepared; the identity data contract/schema foundation exists, but no submission endpoint, encryption boundary, or tests exist.

### AP-036 — Implement per-skill proof document submission

- **Description:** Allow an Advisor to upload proof only for a currently claimed skill, persist
  pending review metadata, and return an allowlisted status. Proof review does not change the skill
  claim or create a public verification badge. Enforce 50 MB/type rules and safe
  replacement/cleanup without changing unrelated skill claims.
- **Priority:** P1
- **Sprint:** S8
- **Story points:** 5
- **Dependencies:** Delivered SeaweedFS storage prerequisite; AP-003
- **Target:** API repository
- **Status:** Partially prepared; proof metadata is modelled, but no submission endpoint, storage workflow, or tests exist.

### AP-037 — Harden and test shared object-storage behavior

- **Description:** Add integration coverage for bucket initialization races, upload/database
  compensation, object replacement, missing objects, presigned URL expiry, account deletion, and
  storage outages. Document retention and orphan-cleanup rules for avatars, chat files, service
  images, identity scans, and skill proofs.
- **Priority:** P1
- **Sprint:** S8
- **Story points:** 5
- **Dependencies:** Delivered SeaweedFS avatar baseline; AP-033, AP-034, AP-035, AP-036
- **Target:** API repository
- **Status:** Partially prepared; the shared SeaweedFS avatar boundary is delivered, but the wider lifecycle and integration evidence are not.

### AP-038 — Capture video quality evidence and produce the 30% report draft

- **Description:** Measure the selected Jitsi path against the applicable call-quality requirement,
  retain environment and result evidence, and produce the 30% report draft from implemented design,
  test, security, and performance artifacts. Clearly label any unmet or unmeasured target.
- **Priority:** P1
- **Sprint:** S8
- **Story points:** 5
- **Dependencies:** AP-032, AP-037
- **Target:** Course deliverable
- **Status:** Proposed

## S9 — trust and safety, Admin operations, and API hardening

### AP-039 — Detect off-platform contact patterns in chat messages

- **Description:** Add deterministic, versioned regex detection for phone numbers, email addresses, LINE
  IDs, and social handles, including basic spacing/punctuation evasion. Persist one evidence-linked
  flag per applicable match, avoid blocking message delivery unless explicitly approved, and add a
  focused false-positive/false-negative fixture suite.
- **Priority:** P0
- **Sprint:** S9
- **Story points:** 8
- **Dependencies:** Delivered Socket.IO/chat core
- **Target:** API repository
- **Status:** Proposed

### AP-040 — Implement Admin flag review and idempotent Advisor penalties

- **Description:** Add Admin-only pending-flag reads and confirm/dismiss decisions. Apply penalty
  points exactly once in a transaction, retain message evidence and reviewer metadata, emit the
  appropriate warning notification, and never expose flags or scores to the Advisor.
- **Priority:** P0
- **Sprint:** S9
- **Story points:** 8
- **Dependencies:** AP-028, AP-039
- **Target:** API repository
- **Status:** Proposed

### AP-041 — Integrate confirmed penalties into public ranking without disclosure

- **Description:** Verify that confirmed penalties rank affected Advisors down through the existing
  discovery algorithm without adding a public field, message, or observable filter for penalties.
  Add regression tests for pending, dismissed, confirmed, and repeated Admin decisions.
- **Priority:** P1
- **Sprint:** S9
- **Story points:** 3
- **Dependencies:** AP-006, AP-040
- **Target:** API repository
- **Status:** Proposed

### AP-042 — Implement user reports and Admin report resolution

- **Description:** Let authenticated users report another user with an optional member-authorized
  chat-room reference, then let Admins list and action/dismiss reports. Retain evidence and decision
  metadata, prevent self-reporting and fabricated room references, and follow 404 non-disclosure.
- **Priority:** P1
- **Sprint:** S9
- **Story points:** 5
- **Dependencies:** AP-025
- **Target:** API repository
- **Status:** Proposed

### AP-043 — Implement Admin user listing and account suspension controls

- **Description:** Add paginated Admin-only user search/detail and suspend/reactivate operations
  using a dedicated Admin DTO. Reuse the global inactive-account denial behavior, immediately
  invalidate suspended-account access, hide private fields not required for operations, and cover
  Admin/non-Admin authorization and inactive-account behavior with database-backed tests.
- **Priority:** P0
- **Sprint:** S9
- **Story points:** 8
- **Dependencies:** Delivered authorization baseline
- **Target:** API repository
- **Status:** Proposed

### AP-044 — Implement the Admin Advisor verification queue and identity decisions

- **Description:** Add the oldest-first pending verification queue with Admin-only private DTOs,
  masked national IDs, and short-lived document URLs. Implement atomic verify/reject decisions,
  require rejection reasons, reject stale reviews, and emit `VERIFICATION_DECIDED` notifications.
- **Priority:** P0
- **Sprint:** S9
- **Story points:** 8
- **Dependencies:** AP-028, AP-035, AP-037
- **Target:** API repository
- **Status:** Proposed

### AP-045 — Implement Admin per-skill proof decisions

- **Description:** Add Admin-only proof review endpoints that approve or reject a pending document,
  require rejection reasons, update only the matching document review record, preserve reviewer
  evidence, reject stale decisions, and notify the Advisor. The decision must not alter the skill
  claim or a public badge.
- **Priority:** P1
- **Sprint:** S9
- **Story points:** 5
- **Dependencies:** AP-028, AP-036, AP-037
- **Target:** API repository
- **Status:** Proposed

### AP-046 — Verify production CORS and cookie-session behavior

- **Description:** Add production-like verification for allowed and rejected origins, credentialed
  preflight requests, session-cookie attributes, trusted-origin enforcement, and stable API error
  responses. Document the required environment configuration without committing deployment secrets.
- **Priority:** P2
- **Sprint:** S9
- **Story points:** 3
- **Dependencies:** Delivered authentication baseline and production environment decisions
- **Target:** API repository
- **Status:** Partially prepared; credentialed CORS and trusted-origin configuration exist, but production-like verification and deployment evidence do not.

## S10 — feature freeze and integration

### AP-047 — Prove the complete Advisee end-to-end journey

- **Description:** Add a reproducible e2e path for discover → optional screening/trial → book → pay
  → chat/file → video access. Exercise real application middleware and database constraints, stub
  only documented external provider boundaries, and retain screenshots/logs as demo evidence.
- **Priority:** P0
- **Sprint:** S10
- **Story points:** 8
- **Dependencies:** AP-008, AP-014, AP-023, AP-030, AP-032, AP-033
- **Target:** API repository
- **Status:** Proposed

### AP-048 — Prove the complete Advisor end-to-end journey

- **Description:** Add a reproducible e2e path for account upgrade/profile → claimed skill → service
  → availability/derived slot → screening decision → booking/payment → consultation → completion. Verify ownership,
  private/public DTO separation, and the absence of self-service Admin promotion.
- **Priority:** P0
- **Sprint:** S10
- **Story points:** 8
- **Dependencies:** AP-003, AP-004, AP-014, AP-023, AP-030, AP-032
- **Target:** API repository
- **Status:** Proposed

### AP-049 — Prepare the UAT environment and deterministic demo seed data

- **Description:** Define a safe, repeatable UAT deployment and seed process with Advisee, Advisor,
  Admin, services, availability, and representative workflow data. Keep credentials outside Git,
  document reset/recovery, avoid production PII, and verify migrations from a clean database.
- **Priority:** P0
- **Sprint:** S10
- **Story points:** 5
- **Dependencies:** AP-047, AP-048
- **Target:** API deployment and course evidence
- **Status:** Proposed

### AP-050 — Run the integration bug bash and enforce feature freeze

- **Description:** Test both principal journeys through the HTTP and WebSocket API surface, triage
  reproducible defects by severity, fix release-blocking regressions within scope, and move
  incomplete new features to Project 2. Record the freeze decision and remaining known limitations.
- **Priority:** P0
- **Sprint:** S10
- **Story points:** 8
- **Dependencies:** AP-047, AP-048, AP-049
- **Target:** API repository
- **Status:** Proposed

### AP-051 — Finalize Project 1 API contract, UAT scripts, and handoff

- **Description:** Complete the remaining module sections of `docs/api-spec.md`, synchronize ER,
  Sprint Plan, backlog, and implementation facts, prepare role-specific UAT scripts for both main
  flows, and link every script step to implemented endpoints and expected evidence.
- **Priority:** P1
- **Sprint:** S10
- **Story points:** 5
- **Dependencies:** AP-050
- **Target:** API repository and course deliverable
- **Status:** Partially prepared; the current API specification and handoff cover delivered modules, but future module contracts and UAT scripts do not exist.

## S11 — functional, load, and security testing

### AP-052 — Execute and document the functional test matrix

- **Description:** Build and run module-level positive, validation, authorization, ownership,
  lifecycle, and recovery cases for all Project 1 requirements. Record environment, inputs,
  expected/actual results, evidence links, defect IDs, and honest pass/fail totals.
- **Priority:** P0
- **Sprint:** S11
- **Story points:** 5
- **Dependencies:** AP-050, AP-051
- **Target:** API repository and course deliverable
- **Status:** Proposed

### AP-053 — Run reproducible API load and latency tests

- **Description:** Create representative read/write scenarios for discovery, booking, payment
  callbacks, and chat. Measure latency, throughput, errors, and resource use, including the
  1,000-concurrent-user target only if the environment supports it; document limits and tune
  evidence-backed bottlenecks.
- **Priority:** P1
- **Sprint:** S11
- **Story points:** 8
- **Dependencies:** AP-050
- **Target:** API repository and test environment
- **Status:** Proposed

### AP-054 — Execute the Project 1 security and PDPA test plan

- **Description:** Test authentication/session handling, role and ownership isolation, object URL
  authorization, webhook verification, upload controls, sensitive-data leakage, account deletion,
  encryption handling, rate/abuse exposure, and applicable OWASP API risks. Record reproducible
  findings without committing secrets or destructive production tests.
- **Priority:** P0
- **Sprint:** S11
- **Story points:** 8
- **Dependencies:** AP-050
- **Target:** API repository and test environment
- **Status:** Proposed

### AP-055 — Remediate release-blocking test findings

- **Description:** Triage findings from functional, load, and security testing; create linked defect
  issues where a fix exceeds one focused change; fix and regression-test all Critical/High and
  release-blocking issues. Document accepted residual risk for anything intentionally deferred.
- **Priority:** P0
- **Sprint:** S11
- **Story points:** 8
- **Dependencies:** AP-052, AP-053, AP-054
- **Target:** API and affected integration repositories
- **Status:** Proposed; estimate must be revisited after findings exist.

### AP-056 — Submit progress report #4 and the 60% report draft

- **Description:** Incorporate completed functional/load/security results, fixes, updated
  traceability, screenshots, measured quality results, limitations, and risk decisions into the
  fourth progress report and 60% draft.
- **Priority:** P1
- **Sprint:** S11
- **Story points:** 5
- **Dependencies:** AP-055
- **Target:** Course deliverable
- **Status:** Proposed

## S12 — user acceptance testing

### AP-057 — Prepare participants, consent, environment, and UAT logistics

- **Description:** Recruit representative Advisors and Advisees, schedule sessions, prepare
  consent/privacy handling, resettable accounts/data, facilitator instructions, success metrics,
  feedback forms, and contingency access. Do not use real identity/payment data in UAT.
- **Priority:** P0
- **Sprint:** S12
- **Story points:** 5
- **Dependencies:** AP-049, AP-051, AP-055
- **Target:** Course deliverable and UAT environment
- **Status:** Proposed

### AP-058 — Execute role-based UAT and collect evidence

- **Description:** Run the prepared Advisor and Advisee scripts without coaching the primary flow,
  record completion, blockers, satisfaction, timing, and qualitative feedback, and preserve
  anonymized evidence. Measure the ≥80% satisfaction and ≥90% unaided main-flow targets honestly.
- **Priority:** P0
- **Sprint:** S12
- **Story points:** 8
- **Dependencies:** AP-057
- **Target:** Course deliverable and UAT environment
- **Status:** Proposed

### AP-059 — Analyze UAT results and approve the defect priority list

- **Description:** Aggregate quantitative and qualitative results, separate defects from new feature
  requests, assign severity and owners, identify release blockers, and obtain team/advisor agreement
  on the S13 fix list. Move out-of-scope requests to Project 2 rather than breaking feature freeze.
- **Priority:** P0
- **Sprint:** S12
- **Story points:** 3
- **Dependencies:** AP-058
- **Target:** Course deliverable
- **Status:** Proposed

## S13 — fixes, traceability, and release validation

### AP-060 — Fix and regression-test approved UAT defects

- **Description:** Implement only the approved release-blocking and necessary UAT fixes, with one
  linked child issue per independently shippable defect when needed. Re-run affected automated/UAT
  cases and update known limitations; do not add unapproved features after freeze.
- **Priority:** P0
- **Sprint:** S13
- **Story points:** 8
- **Dependencies:** AP-059
- **Target:** API and affected integration repositories
- **Status:** Proposed; estimate must be revisited after UAT triage.

### AP-061 — Complete requirements-to-test traceability and quality evidence

- **Description:** Complete CR → TC → QR → F → C → T traceability, House of Quality, important QR
  specifications, function/component mapping, and evidence links. Resolve missing or contradictory
  mappings and distinguish measured results from targets.
- **Priority:** P0
- **Sprint:** S13
- **Story points:** 8
- **Dependencies:** AP-052, AP-053, AP-054, AP-058, AP-060
- **Target:** Course deliverable
- **Status:** Proposed

### AP-062 — Verify ER, use-case, component, and sequence documentation

- **Description:** Reconcile the final implementation with the ER model, API contract, use cases,
  component view, and component-level sequence diagrams. Correct documentation drift while
  preserving UUID, timestamptz, satang, composite-key, auth, and booking-constraint invariants.
- **Priority:** P1
- **Sprint:** S13
- **Story points:** 5
- **Dependencies:** AP-060, AP-061
- **Target:** API repository and course deliverable
- **Status:** Partially prepared; the canonical ER documentation exists, but final implementation reconciliation and the remaining diagrams are not complete.

### AP-063 — Validate and execute the UAT-to-production release

- **Description:** Run the clean migration, configuration, backup/recovery, smoke, auth, and two
  principal-journey checks in the release candidate environment. Release only after validation and
  record version, approvals, rollback steps, checksums/config names, and post-release result without
  exposing secrets.
- **Priority:** P0
- **Sprint:** S13
- **Story points:** 5
- **Dependencies:** AP-060, AP-062
- **Target:** Deployment and release process
- **Status:** Proposed

### AP-064 — Publish the optional user guide and CE Cloud deployment

- **Description:** If core delivery remains green and capacity permits, produce a short role-based
  user guide and evaluate/publish the optional CE Cloud deployment. Clearly document unsupported
  integrations or environment limits.
- **Priority:** P3
- **Sprint:** S13
- **Story points:** 3
- **Dependencies:** AP-063
- **Target:** Course bonus deliverable
- **Status:** Proposed and optional

## S14 — final report and presentation

### AP-065 — Finalize and format the Project 1 report

- **Description:** Integrate final architecture, implementation, traceability, test/UAT results,
  limitations, conclusions, and references; apply required typography, paper, page-numbering, and
  submission format; reserve advisor/coordinator and available format-review time; resolve review
  comments before submission.
- **Priority:** P0
- **Sprint:** S14
- **Story points:** 8
- **Dependencies:** AP-061, AP-062, AP-063
- **Target:** Course deliverable
- **Status:** Proposed

### AP-066 — Create the 15-minute presentation and technical Q&A pack

- **Description:** Build a concise presentation covering the user problem, architecture, two main
  flows, booking concurrency, payment safety, authorization, PDPA, measured quality results, UAT,
  limitations, and Project 2 boundary. Prepare evidence-backed answers for likely technical
  questions.
- **Priority:** P0
- **Sprint:** S14
- **Story points:** 5
- **Dependencies:** AP-065
- **Target:** Course deliverable
- **Status:** Proposed

### AP-067 — Rehearse, record a fallback demo, and prepare examination delivery

- **Description:** Rehearse the timed presentation and demo at least three times, assign speakers
  and handoffs, record a stable fallback demo, verify equipment/network contingencies, and refine
  Q&A based on observed weak points for the 31 Oct–9 Nov examination window.
- **Priority:** P1
- **Sprint:** S14 and examination window
- **Story points:** 5
- **Dependencies:** AP-066
- **Target:** Course deliverable
- **Status:** Proposed

## Standing work — every active sprint

### AP-068 — Maintain weekly governance, evidence, and planning records

- **Description:** Hold and record the weekly advisor meeting and Saturday review/planning; update
  decisions, risks, progress evidence, traceability links, and the next sprint's issue readiness.
  Keep `api-spec.md`, the ER documentation, Sprint Plan, and this backlog aligned with substantive
  changes.
- **Priority:** P1
- **Sprint:** Standing, S4–S14
- **Story points:** 2 per sprint
- **Dependencies:** None
- **Target:** API repository and course delivery process
- **Status:** Proposed recurring issue; create one copy per sprint rather than one issue spanning all milestones.

## Meeting-decision gaps to add before GitHub issue creation

### AP-069 — Implement consultation-eligible service reviews and Advisor replies

- **Description:** Add Advisee review creation only after a completed consultation with that
  Advisor, with one review per appointment and a one-time Advisor reply. Reviews may be submitted
  after completion without an expiry window. Keep public listing and rating summaries allowlisted;
  no review eligibility may be inferred merely from profile views or a Trial grant.
- **Priority:** P1
- **Sprint:** S9, after booking completion is proven
- **Story points:** 5
- **Dependencies:** AP-012, AP-013, AP-007
- **Target:** API repository
- **Status:** Proposed; the `service_reviews` table exists, but no workflow, authorization, or API is implemented.

### AP-070 — Resolve the Advisor-created Skill fallback and anti-spam rule

- **Description:** Turn the agreed fallback (Advisor searches existing Skills first, then may
  create a missing Skill) into a bounded product/API rule. Confirm moderation, duplicate matching,
  rate limits, ownership, and visibility before implementing it; preserve the already agreed
  prohibition on self-service verification badges.
- **Priority:** P1
- **Sprint:** S6 decision; implementation only after the policy is confirmed
- **Story points:** 3
- **Dependencies:** AP-003 and advisor confirmation of the anti-spam policy
- **Target:** API repository and API documentation
- **Status:** Blocked on the meeting's unresolved spam-policy decision; do not implement from this issue yet.

### AP-071 — Finalize the Google Calendar appointment-delivery contract

- **Description:** Turn the meeting decision to send appointments to Google Calendar into a bounded
  contract: event owner(s), OAuth/consent, create/update/cancel behavior, privacy fields, retry
  and revocation rules, and whether it is Project 1 scope. This must remain distinct from Google
  Calendar conflict checking, which is explicitly future work.
- **Priority:** P1
- **Sprint:** S8 decision; implementation only after the contract and provider prerequisites are confirmed
- **Story points:** 3
- **Dependencies:** AP-009, AP-013 and advisor confirmation of the intended Calendar behavior
- **Target:** API repository and API documentation
- **Status:** Blocked on missing API-level behavior; the meeting note alone does not authorize an OAuth or calendar-write design.

## 4. Sprint roll-up

The table records the original course-sprint allocation; it is not the current commitment.
S4 and S5 are carry-over. The current S6 recovery candidate is AP-002, AP-004, AP-009–AP-012, and
AP-014–AP-015 (43 points before splitting), which exceeds the normal sprint capacity and therefore
must be narrowed at planning rather than silently treated as deliverable. Omise is ready, but its
payment implementation does not start until the booking gate is finished.

| Sprint        |        Issues | One-time points | Main gate                                                              |
| ------------- | ------------: | --------------: | ---------------------------------------------------------------------- |
| S4 carry-over |             7 |              39 | Service CRUD is the first recovery dependency; discovery follows       |
| S5 carry-over |             7 |              40 | Booking API/evidence and Progress report #2 remain outstanding         |
| S6 recovery   |     candidate | 43 before split | Restore service → availability → booking; Omise is ready after booking |
| S7            | 4 outstanding |              18 | Room provisioning, notifications, reminders, and chat evidence         |
| S8            |             8 |              47 | Authorized video/files plus 30% report draft                           |
| S9            |             9 |              53 | Trust/safety, Admin operations, and consultation-eligible reviews      |
| S10           |             5 |              34 | Feature freeze with two proven end-to-end paths                        |
| S11           |             5 |              34 | Functional/load/security results and 60% report draft                  |
| S12           |             3 |              16 | Measured role-based UAT and approved fix list                          |
| S13           |             5 |              29 | Necessary fixes, traceability, and validated release                   |
| S14           |             3 |              18 | Final report, presentation, and demo contingency                       |
| Standing      |   1 recurring |    2 per sprint | Governance and evidence remain current                                 |

The recovery schedule makes all post-S6 dates conditional. First defer AP-022, AP-034, AP-046,
AP-064, AP-069, AP-070, and AP-071 if they threaten the S10 freeze; do not defer AP-011 or the booking
concurrency evidence. Delivered prerequisites are intentionally absent from this backlog.

## 5. Dependency-critical path

The main implementation path is:

`AP-002 → AP-004 → AP-009 → AP-010/AP-011 → AP-012 → AP-019/AP-020 → AP-025 → AP-032 → AP-047/AP-048 → AP-050 → AP-055 → AP-058/AP-059 → AP-060 → AP-063 → AP-065/AP-066/AP-067`

Parallel paths join it at these gates:

- Advisor discovery: AP-003/AP-005/AP-006/AP-007 → AP-008 → AP-047.
- Storage and verification: delivered SeaweedFS storage → AP-033/AP-035/AP-036/AP-037 → AP-044/AP-045.
- Trust and safety: delivered Socket.IO/chat core → AP-039 → AP-040 → AP-041.
- Evidence: AP-014/AP-023/AP-030/AP-038 → AP-051/AP-052 → AP-061.

## 6. Explicitly excluded from Project 1

Do not create Project 1 implementation issues for these unless the approved scope changes:

- AI matching, AI summaries/chatbot, or semantic/ML off-platform detection;
- subscriptions or native mobile applications;
- automated bank transfers to Advisors;
- speculative profile/onboarding fields not established by the API contract;
- major new features after the S10 freeze.

They may be collected in a separate Project 2 backlog after the Project 1 issues are approved.

## 7. Recommendation for GitHub issue creation

After approval, create milestones `S4` through `S14`, plus labels for priority, story points, target
repository, and type. Create only the next ready sprint in the first batch, then preview later
batches before writing them to GitHub. Preserve the AP identifiers in issue bodies so proposed
dependencies can be replaced with actual GitHub issue links. Refer to delivered work by capability,
not a retained completed-issue ID.

Suggested labels:

- `priority:P0` through `priority:P3`;
- `points:1`, `points:2`, `points:3`, `points:5`, `points:8`;
- `type:feature`, `type:test`, `type:docs`, `type:integration`, `type:course-deliverable`;
- `area:auth`, `area:discovery`, `area:booking`, `area:payment`, `area:chat`, `area:storage`,
  `area:safety`, `area:admin`, `area:release`;
- `target:api`, `target:course-deliverable`.

## 8. Should this become a reusable Codex skill?

Yes, after the team approves this first backlog and completes one GitHub creation cycle. A useful
skill would not encode this project's product decisions. It would encode the repeatable workflow:

1. inspect repository guidance, status, roadmap, contracts, and implemented modules;
2. separate delivered, in-progress, proposed, optional, and out-of-scope work;
3. validate every issue has title, description, priority, points, sprint, target, and dependencies;
4. detect missing/circular dependencies and oversized issues;
5. render a Markdown preview and require approval before external writes;
6. deduplicate against existing GitHub issues, then create milestones/labels/issues in batches;
7. write the resulting GitHub URLs/numbers back to the approved backlog.

Creating that skill now would be premature because the team has not yet validated the issue shape,
label taxonomy, milestone names, repository targets, or desired GitHub body template.
