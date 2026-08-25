# ER Diagram — conventions and design notes

Companion to `ER.mermaid`. Kept separate because Mermaid's `erDiagram` parser rejects
top-level `%%` comments — putting these notes in the diagram file breaks rendering.

## Conventions

- **Naming.** Attributes are camelCase in the diagram; physical Postgres columns are
  snake_case. Drizzle maps between them.
- **Time.** Every timestamp is `timestamptz`. No naive local time anywhere — two
  interviewees raised timezone as a concern, and advisors/advisees may be in different ones.
- **Money.** Every amount is an integer in **satang**, which is Omise's unit.
  150.00 THB = `15000`. Never store money as float.
- **Keys.** Junction / associative tables carry a **composite primary key and no surrogate
  id**, per the Project Orientation rule: *"ห้ามใช้ ID ในตารางที่ไม่ใช่ Entity พื้นฐาน"*.
  That covers `ADVISOR_SKILLS`, `CHAT_MEMBERS`, `SCREENING_ANSWERS`, `PAYOUT_INVOICES`,
  `SERVICE_IMAGES`, `PDPA_CONSENTS`, `ADVISOR_IDENTITY`, and `SERVICE_REVIEWS`
  (whose PK is its FK). Tables that *are* basic entities keep a uuid — that is what the
  rule permits, and the distinction is the point of it.
- **Files.** Anything stored in the private SeaweedFS bucket is referenced by `objectKey`, never by URL
  — presigned URLs expire, so a stored URL rots. Avatar URLs are generated owner-only on demand and
  expire after five minutes.
- **Checks.** Postgres rejects negative monetary/penalty values, invalid duration and time ranges,
  review stars outside 1–5, and file sizes outside 1 byte–50 MiB. These are database guarantees,
  not validation rules that can be bypassed by another writer.

## Design decisions worth defending at the exam

### Authentication is not modelled here

better-auth generates and owns `user`, `session`, `account`, and `verification`.
`USERS` in this diagram is the **domain** identity and maps 1:1 to better-auth's `user`.
The password hash lives on better-auth's `account` table and deliberately does not appear
here — duplicating it would be a normalization error and would misrepresent the system.

### Booking is created before payment

`SERVICE_APPOINTMENTS` is created in state `PENDING_PAYMENT`, and `SERVICE_INVOICES`
carries the FK to it. This resolves the circular mandatory 1:1 the previous diagram had
(each table requiring the other to exist first), and it matches the concurrency
requirement: the slot is claimed by the appointment row, so the exclusion constraint —
not the payment gateway — is what guarantees no double-booking.

`UNIQUE (appointmentId)` on `SERVICE_INVOICES` enforces the invoice side of that 1:1. A retry must
reuse the existing invoice/payment attempt rather than create a second invoice for one appointment.

### Slot availability is derived, not stored

Slots are calculated from an Advisor's one `ADVISOR_GLOBAL_AVAILABILITY` record and the
Availability Profile selected by the Service. Weekly and specific windows provide candidate
starts; blocked periods always subtract from them. The fixed Project 1 interval is 30 minutes,
and Service and Trial durations must be multiples of that interval.

`SERVICE_APPOINTMENTS` stores the booked consultation range and `unavailableUntil`, which
snapshots the appointment end plus the configured buffer. `blocksAvailability` makes the
cancellation rule explicit: a cancelled appointment releases its range only if doing so still
satisfies the minimum booking notice; otherwise it continues to block that time.

The no-overlap guarantee is a **database-level exclusion constraint** on an Advisor's
`tstzrange(startTime, unavailableUntil)`, not an application-layer check. It therefore prevents
overlaps across every Service and Profile owned by that Advisor and survives concurrent requests.

### Escrow and payouts are modelled in Project 1

`SERVICE_INVOICES.status` runs `PENDING → HELD_IN_ESCROW → RELEASED | REFUNDED | FAILED`,
matching sequence diagram CF-05. `PAYOUTS` records what is owed to an advisor and
`PAYOUT_INVOICES` records which invoices a payout settles.

Advisor take-home is `amountSatang - platformFeeSatang`. The current 2,000-satang transfer fee is
recorded separately on the payout; its allocation is not silently inferred from either party's
balance. An invoice becomes eligible for payout seven days after the consultation completes,
represented by `payoutEligibleAt` before it can be included in a payout.

### Screening and the free trial are optional, and independent of each other

Services still carry two independent switches, but the screening switch is a booking gate:
when `screeningRequired` is on, an Advisee must submit answers and receive an `ACCEPTED`
`SCREENING_REQUESTS` decision before choosing a paid appointment time. Services without that
switch can be booked directly.

| `screeningRequired` | `trialEnabled` | Meaning |
|---|---|---|
| off | off | Book straight away — the default |
| on | off | Answer questions, receive approval, then choose and pay for a time |
| off | on | Request a free trial, then choose a time only after the Advisor grants it |
| on | on | Screening approval and the separate trial flow are both available |

Two switches rather than one because Tan asked for screening so it *"ช่วยเลือกลูกค้าได้"* — that is a
filter. Coupling it to a free trial would force every advisor who wants to filter to also give away
unpaid time.

**One trial per advisee per service** is enforced by the composite primary key
`(serviceId, adviseeId)` on `TRIAL_GRANTS`. A grant is created directly by the Advisor; it has no
request/approval status. A granted trial uses the Service's Availability Profile and configured
trial duration.

There is no separate `TRIAL_SESSIONS` table. A trial is represented by a `TRIAL`
`SERVICE_APPOINTMENTS` row, which keeps the same scheduling, chat-room, and audit path as a paid
consultation without creating an invoice.

`SCREENING_REQUESTS` keeps a uuid PK because it has its own state, decision, reason, answers, and
lifecycle. `TRIAL_GRANTS` is an entitlement junction, so it correctly uses the composite key.
`SCREENING_ANSWERS` also uses a composite key for its junction relationship.

### เลขบัตรประชาชน: stored, encrypted, deliberately not a primary key

`ADVISOR_IDENTITY` holds the national ID for advisor verification. Advisees never submit one.

- `nationalIdEncrypted` — AES at rest, key from the environment. **Never stored or logged in
  plaintext, and never returned by any endpoint.**
- `nationalIdHash` — `UNIQUE`, so two accounts cannot claim the same identity.
- The uploaded scan is a SeaweedFS object key, not a URL.

The natural-key rule was considered here and rejected, for five reasons worth having ready:

1. **PDPA.** A primary key propagates into every foreign key, URL, log line and join. The right to
   be forgotten — which this proposal promises — becomes impossible when other tables reference the
   key you must delete.
2. **The proposal already argues the opposite.** It defends uuid PKs as *"เพิ่มความปลอดภัยในการเข้าถึง
   ข้อมูลผ่าน URL ที่คาดเดายาก"*. `/advisors/1234567890123` is both guessable and sensitive.
3. **It arrives late.** A row cannot be keyed on data that appears at verification time, well after
   the account exists.
4. **It is not universal.** A foreign advisor has a passport, not a เลข 13 หลัก.
5. **Encrypted values cannot serve as a usable key.**

Where the rule *was* applied: every junction table, and the `UNIQUE (adviseeId, serviceId)`
constraint above.

### Identity is the only advisor verification level

**Current product decision (2026-08-22):** registration creates an Advisee only. A user explicitly
upgrades to Advisor, and identity verification remains the only verification workflow.

`ADVISOR_IDENTITY.verificationStatus` is the only verification state: `NONE → SUBMITTED →
VERIFIED | REJECTED`. Skills are claims only; there is no `proofLevel` and no skill-verification
badge. `SKILL_PROOF_DOCUMENTS` may retain optional documents and their review records for
administration, but they do not change a skill or public-profile state.

The badge an advisee sees is **derived, not stored**: an identity-verified Advisor receives the
identity-verified badge; otherwise the Advisor is unbadged.

### Trust & safety has an evidence trail

CF-08 requires that a flagged message keeps its evidence and that an admin can confirm or
dismiss it. `OFF_PLATFORM_FLAGS` points at the offending `CHAT_MESSAGES` row and records
the admin's decision; penalty points accumulate on `ADVISOR_PROFILES`. Search ranking is
computed from `penaltyPoints` rather than stored, so there is no derived column to keep in
sync.

### PDPA

`PDPA_CONSENTS` is keyed `(userId, policyVersion)` so re-consent to a new policy version
is a new row and the history is preserved — which is the point of a consent record.
Right-to-be-forgotten is served by the atomic `DELETE /api/v1/users/me` procedure: it sets
`USERS.status = DELETED`, replaces required identity columns with non-identifying values, revokes
sessions/accounts, erases verification/profile proof data, and unpublishes Advisor services.
FK-bound transaction and safety evidence keeps only the pseudonymous internal UUID.

## Known gaps, deliberately left out

- **Subscriptions** — Project 1 is pay-per-session. Declared future work in `SprintPlan.md`.
- **AI matching / semantic off-platform detection** — future work; detection is regex.
- **Automated bank transfer to advisors** — `PAYOUTS` records the obligation, but executing
  the transfer is manual in Project 1.
