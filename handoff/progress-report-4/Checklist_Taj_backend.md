# Backend checklist — AdvisoryPlatformAPI

Checked against the code on `develop` + branch `taj/backend-checklist` (2026-10-06), not against Figma
(no access yet). `[x]` done and tested · `[~]` partly there · `[ ]` missing · ⛔ blocked.

Sections 1–5 mirror the units assigned to Taj in `Checklist_Taj_frontend.csv`.

---

## 0. Done on `taj/backend-checklist` (this session)

- [x] **Advisor role only after admin approval** (was: `POST /advisors/me` made you an Advisor instantly)
  - `POST /advisors/me` now opens an *application*; role stays Advisee, `verificationStatus: NONE`
  - admin `approve` writes `VERIFIED` **and** `user.role = 'advisor'` in one transaction
  - until approved: availability / my services / my bookings / payouts → `403`
- [x] **Upload ID card** — `POST /advisors/me/identity-verification` (JPG/PNG ≤ 50 MB, Figma Stage 2)
  - resubmit allowed only after `REJECTED`; the old scan is deleted from storage
- [x] **Upload skill proof** — `POST /advisors/me/skill-proofs` (`skillId` + JPG/PNG/PDF, Figma Stage 3); also claims the skill
- [x] `GET /advisors/me` returns `verificationStatus` → frontend can route to pending / failed / thank-you
- [x] Unverified advisors' services hidden from search, public profile, slots and booking (old data too)
- [x] **Bug fixed:** every Advisee could *read* `/advisors/me/availability/*` and `/advisors/me/bookings` (permission overlap)
- [x] **Bug fixed:** seed never set `role='advisor'`, so demo advisors couldn't create/edit anything
- [x] **Bug fixed (new routes only):** Thai upload file names are no longer garbled
- [x] Tests: +22 unit, +9 DB integration (`identity-verification.repository.integration-spec.ts`),
      +4 e2e (`test/advisor-onboarding.e2e-spec.ts` — the whole apply → upload → reject → resubmit → approve flow)
- [x] `docs/api-spec.md` §3 Roles and §7 Advisors updated to the real contract

> ⚠️ After this merges, demo advisors **Thanakrit, Pimchanok, Sarawut** (identity SUBMITTED/REJECTED in the seed)
> disappear from search until an admin approves them in the console. That is the rule working, not a bug.

---

## 1. Authentication & Roles (Better Auth) — P2

- [x] Register / login / logout / session (better-auth, e2e-tested)
- [x] Register – email in use, validation errors (better-auth responses)
- [x] PDPA consent — `POST/GET /pdpa-consents`
- [x] Delete account (anonymize) — `DELETE /users/me`
- [x] Advisee profile view / edit, avatar upload — `/users/me`, `/users/me/avatar`
- [~] Change password — better-auth has `POST /api/auth/change-password` built in; not documented in api-spec, no e2e test
- [ ] Login – **account locked** after N wrong passwords — no lockout exists (better-auth only rate-limits)
- [ ] Delete account – **blocked** state (e.g. has upcoming bookings / unpaid payout) — no rule exists
- ⛔ Forgot password, reset link sent / expired — **needs mail server**
- ⛔ Verify email — **needs mail server**
- ⛔ Change email (+ "already in use") — better-auth `change-email` sends a verification mail → **needs mail server**
- [ ] **Bug (pre-existing on develop):** after `DELETE /users/me` the old cookie gets `403` instead of `401` for up to
      5 min (session cookie cache added in the "perf" commit). Failing e2e: *anonymizes an account and immediately revokes authentication*

## 2. Service management (create / edit / unpublish) — P0

- [x] My services list / detail / create / edit / delete — `/advisors/me/services`
- [x] Unpublish = `PATCH { isPublished: false }`
- [x] Per-service daily limit (`dailyConsultationLimitMinutes`), trial on/off + duration, screening on/off flags
- [x] "Create service – no profile yet" → now `403` until approved (frontend should send them to onboarding)
- [ ] Service images — schema has `service_images`, **no upload route**
- [ ] `PUT /advisors/me/skills` (replace claimed skills) — in spec, **not implemented**

## 3. Timeslot management (no-overlap) — P3

- [x] Global availability (interval, buffer, horizon, min notice, daily limit) — `/advisors/me/availability/global`
- [x] Profiles: weekly windows, specific dates, blocked dates/periods — `/advisors/me/availability/profiles`
- [x] Derived slots in advisor timezone — `GET /services/:id/slots`
- [x] No-overlap: Postgres exclusion constraint + per-advisor advisory lock (concurrency e2e test)
- [ ] Advisor calendar view endpoint (bookings across a date range for the calendar screen) — check with Figma whether
      `GET /advisors/me/bookings` filters are enough

## 4. Booking (calendar + slot picker) — P0

- [x] Create booking (one slot) → `PENDING_PAYMENT`; my bookings; detail; cancel; reschedule; review
- [x] Advisor side: start / complete / no-show / cancel
- [x] Slot taken → `409`; beyond window / no slots → derived slots empty
- [~] **Max slots reached / non-contiguous slots** — meeting notes: *Advisee can book several sessions at once*.
      `POST /bookings` takes **one** `startTime`. Phuwit's payment branch takes `startTimes[]` → needs one owner
- [ ] **Screening required** — Trin's `feat/screening` (not merged); slots/booking must check accepted screening
- [ ] **Trial booking** — enum `TRIAL` exists, no request/grant/book flow
- [ ] Cancel & **refund request with evidence files** — `POST /refunds` takes text only; evidence upload route missing
- ⛔ **Payment ↔ appointment** — Phuwit (`phuwit/payments-invoices`), see §7

## 5. File storage (50 MB, permissions) — P3

- [x] SeaweedFS boundary, private keys, presigned URLs (avatar, chat files)
- [x] Identity scans + skill proofs (this branch)
- [ ] Admin sees ID card / proof documents → needs **presigned URL** in admin identity & proof responses
- [ ] Refund evidence upload (see §4)
- [ ] Thai file names in **chat** uploads are still stored garbled (same fix as skill proofs: `decodeUploadedFileName`)
- [ ] Content sniffing — type check trusts the client's MIME type (avatar, chat, documents)
- [ ] Chat file expiry sweeper (`expiry_date` is written, nothing deletes)

---

## 6. Other backend gaps (not on Taj's list, but needed)

- [ ] National ID **number** — Figma doesn't ask for it; spec wants it encrypted + hashed to block duplicate accounts.
      Needs a decision + `IDENTITY_ENCRYPTION_KEY` env
- [ ] Notifications — `notifications` table exists, nothing writes it (approval, rejection, booking, refund…)
- [ ] Off-platform detection — admin can review flags, but **nothing creates flags** from chat messages (regex detector)
- [ ] Payouts — admin can mark paid/failed, but nothing **creates** payouts or sets `payoutEligibleAt` (+7 days after complete)
- [ ] Meetings — Jitsi (`wip/jitsi-integration`, 115 commits behind) + Google Calendar
- [ ] Advisor penalty points when advisor cancels (meeting notes §6)
- [ ] Admin masked national ID, signed document URLs, `VERIFICATION_DECIDED` notification (spec §7)

## 7. Review notes for Phuwit — `phuwit/payments-invoices`

Left to Phuwit by decision. Things that will bite when it merges:

1. **Bypasses `BookingsService`**: `createInvoice` inserts appointments itself → skips slot eligibility, the per-advisor
   advisory lock, daily limits, min notice, horizon, screening, and (now) the verified-advisor check.
   Its overlap check is per-**service**, not per-advisor. Should call `BookingsService.create` (or a multi-slot variant).
2. **Never confirms**: callback reads charge status but never moves the invoice to `HELD_IN_ESCROW` nor calls
   `BookingsService.confirmPayment()` (that hook already exists). Needs an **Omise webhook** too — the browser redirect
   alone is not reliable.
3. **Schema churn**: 4 migrations add/drop `appointment_id` back and forth; squash before merge. Dropping
   `service_invoices.appointment_id` breaks refunds, payouts and the seed, which all join on it.
4. `PaymentService` imports `drizzle-orm` and writes SQL (repo rule: services never import drizzle).
5. `src/mock/*` still used on develop's `payment.service.ts` — delete once real flow lands.
6. Controller uses `@Res()` / `@Redirect` — repo rule is the `{statusCode,message,data}` envelope.

## 8. Needs Figma / product answers

- [ ] Stage 1 asks **phone** and **birth date** — no columns for them in the API. Store? Where?
- [ ] Stage 1 has no **headline** field, but `POST /advisors/me` requires one — derive it, or make it optional?
- [ ] Can a **rejected** applicant still edit their profile / skills, or only re-upload the ID card?
- [ ] Should skill proofs be **required** before approval (frontend demands one per skill; API doesn't enforce)?
