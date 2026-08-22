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

`SERVICE_TIMESLOTS.status` is `OPEN` / `BLOCKED` and expresses only what the *advisor*
chose. Whether a slot is taken is derived from whether a live `SERVICE_APPOINTMENTS` row
points at it. Storing a `isBooked` flag would be a second copy of that fact and would
drift.

The no-overlap guarantee is a **database-level exclusion constraint** on
`(serviceId, tstzrange(startTime, endTime))`, not an application-layer check. This is the
project's first Success Criterion and it must survive concurrent requests.

### Escrow and payouts are modelled in Project 1

`SERVICE_INVOICES.status` runs `PENDING → HELD_IN_ESCROW → RELEASED | REFUNDED | FAILED`,
matching sequence diagram CF-05. `PAYOUTS` records what is owed to an advisor and
`PAYOUT_INVOICES` records which invoices a payout settles.

Advisor take-home is `amountSatang - platformFeeSatang` and is deliberately **not** stored
as a third column — it is derivable within the row.

### Screening and the free trial are optional, and independent of each other

**Booking never depends on screening.** Most services are bought directly. `SERVICES` carries two
independent switches:

| `screeningRequired` | `trialEnabled` | Meaning |
|---|---|---|
| off | off | Book straight away — the default |
| on | off | Answer my questions first, then pay — a filter, not a giveaway |
| off | on | Free chat, no form |
| on | on | The full CF-03 flow |

Two switches rather than one because Tan asked for screening so it *"ช่วยเลือกลูกค้าได้"* — that is a
filter. Coupling it to a free trial would force every advisor who wants to filter to also give away
unpaid time.

**One trial per advisee per service**, enforced by `UNIQUE (adviseeId, serviceId)` on
`SCREENING_REQUESTS`. An advisee who already knows the advisor is not pushed through a trial, and
nobody farms free sessions by re-applying.

There is no separate `TRIAL_SESSIONS` table. It was strictly 1:1 with the screening request and held
three timestamps; those now live on the request itself (`chatRoomId`, `trialStartedAt`,
`trialExpiresAt`, all null unless a trial was granted).

`SCREENING_REQUESTS` keeps a uuid PK rather than the natural `(adviseeId, serviceId)` composite,
because a composite would force `SCREENING_ANSWERS` into a three-column key in which `serviceId` is
already determined by `questionId` — redundant, and the kind of thing a normalization check flags.
The Orientation rule bans surrogate ids on tables that are *not* basic entities; a screening request
has a status, a decision, a reason and a trial window, so it is one.

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

### Proof of expertise has two axes, not one ladder

**Current product decision (2026-08-10):** registration creates an Advisee only. The historic
reference to an onboarding wizard below is superseded: a user explicitly upgrades to Advisor first,
then identity and skill verification remain separate trust checks.

Identity and skill are different claims and are verified separately — which is already how the UX
onboarding wizard is split (Stage 2 identification, Stage 3 skills + proof of skill).

- **Identity**, on the advisor: `ADVISOR_IDENTITY.verificationStatus` — `NONE → SUBMITTED →
  VERIFIED | REJECTED`.
- **Skill**, per claimed skill: `ADVISOR_SKILLS.proofLevel` — `SELF_DECLARED → DOCUMENT_SUBMITTED →
  ADMIN_VERIFIED`, evidenced by `SKILL_PROOF_DOCUMENTS`.

The badge an advisee sees is **derived, not stored**: identity verified plus at least one
admin-verified skill reads as a verified expert; identity alone reads as identity-verified;
otherwise unbadged.

A single ladder on the advisor was rejected because an advisor at "certificates verified" who lists
five skills is implicitly claiming proof for all five when the admin may have checked one. That is
exactly the *"CV/Resume ปลอมความสามารถ"* problem Tan raised in his interview — a single ladder would
launder it.

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
