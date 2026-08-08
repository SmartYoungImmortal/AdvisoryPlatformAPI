---
tags:
  - spec
  - kmitl
  - advisory
---

# Frontend ↔ Backend contract

**For:** Copper, Nam, ภาค — and Tajdang (backend)
**Purpose:** the things that **break** if the two sides assume different answers. Not a summary of
the API; the API is in [`API.md`](./API.md).

Read this before the Wednesday meeting. Sections 1 and 2 need a decision from the team.
Section 3 is already decided — build against it.

---

## 1. Blocking — nobody can build correctly until these are answered

### 1.1 Does an advisor's service need admin approval before it goes live?

Right now the ER has `SERVICES.isPublished` as a plain boolean: an advisor writes a service and it
is instantly public. The proposed change is a status — `DRAFT → PENDING_REVIEW → PUBLISHED →
ARCHIVED` — with an admin review step.

**This may be redundant.** We already verify the advisor's identity and their skill certificates. If
the person is verified, is reviewing every service they write worth the admin queue?

| If review is **required** | If review is **not** required |
|---|---|
| Admin console needs a service review queue screen | No new admin screen |
| Advisor's "My services" needs status badges + a rejection reason banner | "Published / not published" toggle is enough |
| Advisor edits a live service → does it leave Discovery until re-approved? | Edits are instant |
| One more state machine to explain in the report | Simpler diagram |

**Needed from the team:** yes or no. If yes, also: every service, or only an advisor's first?

*(Backend note: rejection sends the service back to `DRAFT` with a `rejectionReason`, and archiving
a service keeps existing paid bookings alive — those two are already decided, they just don't matter
unless the answer here is yes.)*

### 1.2 Cloudflare Workers, or self-host everything?

The 1-08 meeting recorded *"ภาคอยากให้ self host ทั้งหมด มีแค่ omise เท่านั้นที่เป็น third party"*.

But `AdvisoryPlatform` currently ships `@opennextjs/cloudflare`, `wrangler.jsonc`, an
`open-next.config.ts` and a "CLOUDFARE DEPLOY CONFIG" commit. Those two statements cannot both be
true.

This is not only a deployment question — it changes:

- where the API lives, and therefore **whether auth cookies are same-site or cross-site** (§3.2)
- whether MinIO is reachable from the browser for direct uploads, or everything proxies through the API
- what the report's security chapter argues, since the whole self-hosting rationale is in there

**Needed from the team:** one of — full self-host on a VPS (drop Cloudflare), or Cloudflare for the
frontend only with API/DB/MinIO/Jitsi self-hosted. Either is defensible; not deciding is not.

### 1.3 The `better-auth` branch in the frontend repo

`AdvisoryPlatform` has a `better-auth` branch carrying `lib/server/auth.ts`, a Drizzle adapter,
`lib/server/db/schema/auth.schema.ts` and a migration.

All database work has since moved to `AdvisoryPlatformAPI`. So that branch is either the POC result
(keep the learnings, delete the code) or work someone still intends to continue (in which case we
have two auth implementations and two schemas).

**Needed:** confirmation it can be deleted, and that `drizzle*`, `pg` and `better-auth` come out of
the frontend's `package.json`.

---

## 2. Frontend needs to tell backend

### 2.1 UI first, or contract first?

The team decided *"Backend ทําตามที่ ux/ui frontend ขึ้นไปก่อน"* — backend follows the UI. As of
6 ส.ค., `app/page.tsx` is still the stock Next.js template, so there is nothing to follow.

Backend cannot idle for a sprint. The proposal: **`API.md` is the contract**, and it is written from
the UX/UI Page list rather than from finished screens. Frontend builds against it; if a screen needs
a field the API doesn't return, that is a normal change request, not a redesign.

**Needed:** agreement that `API.md` is authoritative, and a heads-up when a screen needs something
that isn't in it.

### 2.2 Which screens land first?

Backend module order is fixed by dependency: Auth → User/Profile → Discovery → Booking → Payment →
Chat/Notification → Video/File → Admin. If frontend builds in a very different order, one side is
always blocked.

**Needed:** rough confirmation the UI order is compatible, or tell me where it isn't.

---

## 3. Already decided — build against this

These come from `API.md` and `AdvisoryPlatformAPI/CLAUDE.md`. Not open for redesign, but say so now
if any of them makes the frontend awkward.

### 3.1 Every response has the same envelope

```jsonc
// success
{ "statusCode": 200, "message": "Success", "data": { ... } }

// list
{ "statusCode": 200, "message": "Success",
  "data": { "items": [...], "total": 128, "page": 1, "limit": 20, "totalPages": 7 } }

// error — SAME three keys, plus errors[] for field problems
{ "statusCode": 400, "message": "Validation failed", "data": null,
  "errors": [ { "property": "priceSatang", "message": "priceSatang must not be less than 0" } ] }
```

**`data` is always where the payload is, success or failure.** A list endpoint returns
`data.items`, never a bare array — so write the fetch wrapper once and unwrap `data` unconditionally.

### 3.2 Auth is a session cookie from better-auth

- better-auth owns `/api/auth/*`. Use the better-auth **client SDK** for sign-up, sign-in, sign-out
  and session — do not hand-roll those calls.
- Everything else is `/api/v1/*` and requires the session cookie. Send `credentials: "include"`.
- **401 means no session** → redirect to login. **403 means signed in but not allowed** → show a
  message, do not redirect. Treating them the same produces a redirect loop.
- If the API ends up on a different origin (§1.2), we need CORS with credentials and
  `SameSite=None; Secure`. **This is why §1.2 blocks.**

### 3.3 Users have two names — pick the right one, always

| Field | Who may see it |
|---|---|
| `displayName` | everyone |
| `fullName` | **the owner and admin only** |

An advisor **never** sees an advisee's legal name — three of four advisees asked for that in the
interviews. Advisee-facing and advisor-facing DTOs simply do not contain `fullName`, so if you find
it in a response outside the owner's own profile or an admin screen, that's a backend bug — report
it.

Signup therefore needs a `displayName` field. It is `UNIQUE`, so the form needs a taken-name error.

**เลขบัตรประชาชน is never returned by any endpoint, to anyone — including admin.** Admin screens show
a masked form plus the uploaded document. Do not build a field expecting to read it back.

### 3.4 What renders without a login

Public: service search and detail, advisor public profile, reviews, categories, skills.
Everything else needs a session.

`main` is tagged SEO, so those pages must render server-side without a session. Don't put the whole
app behind an auth wrapper.

### 3.5 Money is an integer in satang

`priceSatang: 150000` is **1,500.00 บาท**. Divide by 100 for display, multiply by 100 on input.
Never send a float. Never do arithmetic on the displayed value.

Advisors see `amountSatang`, `platformFeeSatang` and net on their own bookings. Advisees see
`amountSatang` only — the fee fields are absent from their DTO, not null.

### 3.6 Pagination

Query `?page=1&limit=20`. `limit` is capped at **100** — over that is a 400, not a silent clamp.
Response carries `total`, `page`, `limit`, `totalPages`.

Chat history will use cursor pagination instead (`?before=<messageId>&limit=50`) when it lands in
S7, because offset shows duplicates while new messages arrive.

### 3.7 Files

Uploads are `multipart/form-data`, **50MB max** per file.

Responses return an **object key**, never a URL — `"avatarKey": "avatars/3f1c.webp"`. To display a
file, ask the API for a short-lived signed URL. Do not cache those URLs; they expire.

*(If §1.2 lands on full self-host, direct-to-MinIO upload becomes possible and this changes.)*

### 3.8 IDs are uuid v4

All path params are uuids. A malformed one is **422**, not 404. Don't construct ids client-side.

### 3.9 Timestamps

ISO 8601 with offset: `"2026-08-06T14:22:00+07:00"`. Users have a `timezone` on their profile —
render in **the viewer's** timezone, not the server's. Two interviewees raised timezone confusion
specifically.

### 3.10 Booking is created before payment

A booking starts as `PENDING_PAYMENT`, not `BOOKED`. It becomes `BOOKED` only when Omise confirms.

So after `POST /bookings` the UI must show a pending state and wait for confirmation — **not** a
success screen. Two people can hold the same slot in `PENDING_PAYMENT` for a moment; the loser gets
**409** at payment time. That path needs a real screen, not a toast.

### 3.11 Screening and trial are optional, per service

`screeningRequired` and `trialEnabled` are **independent** booleans on a service. Four valid
combinations, and the booking flow must handle all of them:

| screeningRequired | trialEnabled | Flow |
|---|---|---|
| false | false | straight to booking — **the default and most common** |
| true | false | answer questions → wait for advisor → then book |
| false | true | free chat, then book |
| true | true | full CF-03 flow |

**Do not build the screening step as a mandatory stage in the booking funnel.** One free trial per
advisee per service, ever — a second attempt returns 409.

---

## 4. Open questions from backend to frontend

1. Does the UI need a combined "advisor + their services" endpoint, or are two calls fine? Affects
   the <3s page-load requirement.
2. For Discovery filters — do you need facet counts ("Marketing (12)"), or just the filtered list?
   Facets are meaningfully more work.
3. Optimistic updates anywhere? If so, tell me which mutations, because they need idempotency keys.
4. Real-time: Socket.IO lands in S7. Until then, does the notification bell poll, or stay empty?
5. PWA offline shell — which screens must work offline? Right now I've assumed none.
