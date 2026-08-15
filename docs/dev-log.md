# Dev log

A running record of what changed and why, session by session — for picking this back up cold,
not a user-facing release log (that's a different document, if this project ever needs one).
Newest first. One entry per session with anything worth remembering; skip trivial sessions.

## 2026-08-15 — extracted typed composite-key mechanics

- Added a composition-based `CompositeKeyStore` for junction-table exact-key predicates and
  mechanical find, exists, create, and delete operations. Key objects are inferred from the supplied
  Drizzle columns, so missing or incorrectly typed key components fail TypeScript checks.
- Kept feature repositories plain and named. The store is an internal implementation detail; joins,
  authorization, transactions, updates, and relationship invariants remain in the feature
  repository. `ChatRepository` now demonstrates this split for `(chatRoomId, memberUserId)`.
- Added real-Postgres coverage using the `(userId, policyVersion)` PDPA consent key, including exact
  selection, existence, creation, deletion, missing rows, and invalid one-column configuration.

## 2026-08-15 — implemented authenticated realtime chat

- Added a Socket.IO `/chat` namespace authenticated through the same Better Auth HttpOnly cookie
  as HTTP. Handshakes reject missing sessions and inactive users, and the Socket.IO adapter derives
  credentialed CORS from `TRUSTED_ORIGINS` so the two transports cannot drift.
- Added member-only room listing, deterministic paginated history, persistent socket message sends,
  room broadcasts, and message-ID-based read markers. Non-member probes consistently return 404.
- Read markers use PostgreSQL `greatest(...)`, making them monotonic under delayed or reordered
  events. Unread counts exclude the current member's own messages and use new membership/history
  indexes.
- Kept room creation and membership changes out of the public API. Those must be provisioned
  atomically by the future appointment or accepted-trial workflow; neither upstream module exists
  yet, so this change does not invent an unrestricted room-creation path.
- Added unit, Postgres integration, and real cookie-preserving Socket.IO e2e coverage, including
  unauthenticated handshakes, participant broadcasts, persistence, read updates, and non-member
  isolation.

## 2026-08-15 — isolated external storage in e2e tests

- Replaced the live MinIO dependency in the e2e application with a reusable in-memory storage stub.
  The suite still runs the real Nest HTTP stack, Better Auth cookie sessions, and PostgreSQL.
- Strengthened avatar e2e assertions to verify stored content metadata, replacement cleanup,
  explicit removal, signed-URL parameters, and account-deletion cleanup through the storage
  boundary.

## 2026-08-15 — made the repository API-only

- Removed the separately owned client application as a source of contract authority. The API
  specification now owns request/response behavior, resolved from documented product, privacy, and
  security requirements.
- Replaced client-application and offline-shell coordination work in the sprint plan and proposed
  issue backlog with API-owned contract, CORS, trusted-origin, cookie-session, and end-to-end API
  verification work.
- Kept browser cookie and CORS documentation where it defines API authentication and security
  behavior; no client application implementation is in this repository's scope.

## 2026-08-15 — completed the S3 own-profile API path

- Standardized imports on `@/` for cross-directory and cross-feature dependencies while retaining
  `./` inside a feature. Added matching TypeScript and Jest resolution; Nest's compiler rewrites
  aliases to relative paths in emitted JavaScript, so production does not need a runtime loader.
- Standardized successful `DELETE` responses across all current modules: services now map the row
  returned by deletion through a response DTO instead of discarding it, and `ApiDelete` derives its
  documentation from that DTO. This is the required convention for future modules as well.
- Added owner-only `GET/PATCH /api/v1/users/me` as the stable base-profile path for every signed-in
  account. The response allowlists private owner fields and returns additive `ADVISEE`, `ADVISOR`,
  and `ADMIN` memberships so clients do not need to probe role-protected endpoints.
- Added the specified `PATCH /api/v1/advisors/me` path for Advisor headline/bio updates while
  retaining the separate Advisor-owner response DTO.
- Kept email, status, role, and avatar-key mutation out of the general profile DTO.
- Completed that anonymization design as an atomic owner-only delete: revoke sessions/accounts,
  erase identity/skill-proof and notification data, replace required identity fields, retain the
  pseudonymous FK anchor, anonymize the Advisor extension, and unpublish owned services.
- Added owner-controlled avatar removal while continuing to reject client-provided object keys.
- Removed repeated Swagger resource labels where a response DTO already supplies the name. The
  composed decorators now derive readable labels from `*ResponseDto` by default and accept a
  `{ name }` override only when the audience-specific DTO name is not the desired wording.
- Centralized additive role lookup and stable ordering in one shared `RoleResolver`, used by both
  `SessionGuard` and the Users own-profile path; its focused repository is now the sole owner of the
  Advisor/Admin membership query.

## 2026-08-15 — added private MinIO-backed avatars

- Added local MinIO Docker Compose support and typed runtime configuration. The application creates
  the configured bucket lazily, so a fresh local setup only needs `docker compose up -d`.
- Avatar uploads accept only JPEG, PNG, and WebP content, are limited to 5 MiB in both Multer and
  service validation, and receive server-generated keys under `avatars/<user-id>/`; clients never
  provide an object key.
- The bucket remains private. The owner-only read route returns a new five-minute presigned URL on
  demand, while PostgreSQL stores only the object key. Replacements, removal, and account deletion
  best-effort clean up old objects after the authoritative database change.

## 2026-08-12 — removed unusable Swagger cookie authorization

- Removed Swagger's `better-auth.session_token` Authorize popup. Browser JavaScript cannot set the
  `Cookie` header directly, so the popup falsely implied that a copied Better Auth HttpOnly session
  could authenticate Swagger requests. Public operations are visibly marked instead; protected
  route documentation explains the usable Postman/browser-session workflows.

## 2026-08-12 — repository quality pass

- Removed the Nest starter root controller/service/test and replaced the generic starter README
  with project-specific setup, verification, and documentation links.
- Collapsed the duplicated 329-line Claude guide into a compatibility pointer to `AGENTS.md`, and
  rewrote `docs/HANDOFF.md` as a current snapshot instead of retaining contradictory old snapshots.
- Enabled full TypeScript strict mode and promoted unsafe/floating-promise lint warnings to errors.
  `npm run lint` is now non-mutating; `npm run lint:fix` is the explicit write command.
- Hardened input DTOs so required names/headlines are trimmed and cannot be blank. Removed the
  unusable `Guest` authorization enum and skipped profile lookups when the implicit Advisee role
  already grants access.
- Fixed Swagger accuracy: public routes no longer inherit global 401/403/422 claims, protected
  composed decorators document cookie/auth failures, and DELETE documents its `data: null` envelope.
- Added Better Auth lookup indexes and canonical account/session delete cascades. Added database
  checks for monetary values, durations, trial windows, timeslots, review stars, upload size, and
  penalty values; enforced one invoice per appointment; and added `modifiedAt` to categories.
- Added focused SessionGuard and AdvisorsService unit tests, full signup/session/signout/signin e2e
  coverage, blank-input rejection, and stronger Swagger composition assertions.
- Added a real aggregate Istanbul report across unit, integration, and e2e runs. CI now rejects any
  aggregate statements, branches, functions, or lines metric below 80%.

## 2026-08-12 — consolidated the sprint documentation

- Merged the detailed historical `docs/sprint.md` content and the rebaselined `docs/SPRINT-PLAN.md`
  decisions into one authoritative `docs/SPRINT-PLAN.md`. `docs/sprint.md` is now a compatibility
  redirect only, preventing two active plans from drifting.
- The merged plan retains the detailed WBS, course deliverables, evidence, risks, and Project 2
  boundary while using the current Advisee-first model, S1–S3 delivery state, provisional-calendar
  caveat, S10 feature-freeze rule, and CI/coverage-gate reality.

## 2026-08-11 — authorization baseline hardened and proven

- Added an explicit Better Auth endpoint contract to `docs/api-spec.md`. Auth responses are now
  documented as a deliberate exception to the Nest `/api/v1/*` response envelope.
- Restricted Better Auth's server-owned `status` and `avatarKey` fields with `input: false`. Signup
  always creates an `ACTIVE` Advisee and cannot set those fields from client input.
- Hardened `SessionGuard`: a valid session now needs an `ACTIVE` account. `SUSPENDED` and `DELETED`
  accounts receive 403 before role resolution.
- Replaced the S2 advisor-status stub with an atomic Advisee-to-Advisor upgrade endpoint and a real
  Advisor profile response. A repeat upgrade returns the contract's 409.
- Extracted production HTTP setup into `configureApp()` and added ESM-capable, cookie-preserving
  auth e2e tests. They prove 401, Advisor upgrade, role 403/allow, and suspended-account denial.
- Added deterministic repository ordering, update-time hooks for `modifiedAt` columns, graceful
  Postgres pool shutdown, and `noImplicitAny` TypeScript enforcement.
- Added a GitHub Actions workflow that migrates a disposable Postgres service and runs build, lint,
  unit coverage, integration, and auth e2e checks on pushes and pull requests. It reports coverage;
  the 80% aggregate gate remains intentionally pending until coverage is aggregated correctly.
- Expanded the auth contract with copy-paste JSON and curl examples for signup, sign-in, session,
  sign-out, and the Advisor upgrade request. The prior endpoint table alone was not actionable.
- Renamed the own-profile DTO from `AdvisorMeResponseDto` to `AdvisorOwnProfileResponseDto` to make
  its audience boundary explicit. Public discovery and admin lists will each get a separate response
  DTO rather than risking a field leak by reusing an ambiguous `AdvisorResponseDto`.

## 2026-08-10 — rebaselined delivery plan and Advisee-first accounts

- Added `docs/SPRINT-PLAN.md` as the repository's active planning baseline. It treats the supplied
  `SprintPlan(1).md` as historical input, preserves its dependencies, and marks inherited dates as
  provisional pending calendar confirmation.
- **Product decision:** signup always creates an Advisee. There is no role selector or onboarding
  wizard. An authenticated Advisee explicitly upgrades to Advisor by creating an advisor profile;
  identity/skill verification remains a separate trust process. The API specification, working
  guide, and Swagger wording now reflect this.
- Reprioritized S3 around auth proof: the e2e suite currently fails to load Better Auth's ESM build,
  and no auth/controller tests exist. Repairing that harness, documenting `/api/auth/*`, and testing
  cookie-session 401/403/allowed behavior come before later module work.
- Flagged a contract conflict for `POST /api/v1/advisors/me`: it cannot be both idempotent and
  return `409` when repeated. Resolve the intended repeat-upgrade behavior before implementation.

## 2026-08-08 — better-auth, Skills/Service-Categories modules, Swagger auth indicators

- **better-auth wired in**: `SessionGuard` (global `APP_GUARD`), `@Public`/`@Roles`/`@CurrentUser`,
  `user`/`session`/`account`/`verification` tables hand-written to match `@better-auth/core`'s
  canonical schema — `@better-auth/cli` (1.4.21) trails the installed core (1.6.26), so generate-
  then-edit was skipped in favor of getting the uuid shape right from the start. Full details in
  `CLAUDE.md`'s better-auth section.
- **Two CRUD modules** (`skills`, `service-categories`) as Swagger-testable examples — the only two
  pure-CRUD modules per `CLAUDE.md`'s "no `BaseCrudService`" note. Both verified live: public reads,
  403 for a signed-in non-admin write, 201 once promoted to admin.
- **Swagger cookie-auth lock icon, made automatic**: baked into `@ApiCreate`/`@ApiUpdate`/
  `@ApiDelete` (always) and `@ApiGetOne`/`@ApiGetPaginated` (default; opt out with
  `{ public: true }`) instead of added by hand per controller.
- **Fixed a real bug**: `TransformInterceptor` dropped the `data` key entirely when a handler
  returned `undefined` (a void `DELETE`) — `JSON.stringify` silently drops `undefined`-valued keys,
  breaking the envelope's "every response has the same three keys" contract. Now coerces to `null`.
- **Fixed a real gap**: `EntityRepository.findMany()` had no `limit`/`offset` support, despite every
  list endpoint needing pagination.
- **Moved `auth/` and `advisors/` under `src/modules/`** — `CLAUDE.md`'s layout already specified
  this; they'd just been built at the wrong level and needed correcting before it compounded.
