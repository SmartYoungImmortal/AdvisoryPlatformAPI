# Advisory Platform — API Specification

**Status: SAMPLE.** Authentication, own-user profiles, and the Advisors module are specified. This
document establishes the format for the remaining modules; do not treat the list at the bottom as
done.

Data model: [`ER.mermaid`](./ER.mermaid) · rationale: [`ER.README.md`](./ER.README.md)
Implementation conventions: [`../AGENTS.md`](../AGENTS.md) · delivery baseline:
[`SPRINT-PLAN.md`](./SPRINT-PLAN.md)

---

## 1. Conventions

**Base paths.** `/api/auth/*` belongs to better-auth. Everything else is `/api/v1/*`.

**Every non-auth response has the same envelope.** API consumers read successful payloads from
`data`; list payloads use `data.items` rather than a bare array.

```jsonc
// success
{ "statusCode": 200, "message": "Success", "data": { ... } }

// paginated — data.items, never a bare array
{ "statusCode": 200, "message": "Success",
  "data": { "items": [...], "total": 128, "page": 1, "limit": 20, "totalPages": 7 } }

// cursor-paginated feed - pass nextCursor back unchanged to continue
{ "statusCode": 200, "message": "Success",
  "data": { "items": [...], "limit": 20, "nextCursor": "opaque", "hasMore": true } }

// failure
{ "statusCode": 409, "message": "Timeslot already booked", "data": null }

// validation failure
{ "statusCode": 400, "message": "Validation failed", "data": null,
  "errors": [ { "property": "priceSatang", "message": "priceSatang must not be less than 0" } ] }
```

**Auth.** Session cookie issued by better-auth. Every route requires a session **except** those
marked `Public`. Auth is opt-out, so a forgotten decorator fails closed.

**Money** is always an integer in satang. **Timestamps** are ISO 8601 with offset.
**IDs** are uuid v4.

**Delete responses.** A successful `DELETE` returns an allowlisted representation of the deleted
resource in `data`. Repositories may use Postgres `RETURNING`, but controllers never expose the raw
row; the service maps it through the same audience-appropriate response DTO rule as other routes.

**Common errors, when applicable:**

| Code | When                                                               |
| ---- | ------------------------------------------------------------------ |
| 401  | No session, or expired                                             |
| 403  | Session valid, role or ownership insufficient                      |
| 400  | Request validation fails, including an invalid UUID path parameter |
| 429  | Rate limit                                                         |
| 500  | Unhandled                                                          |

---

## 2. Authentication API

Authentication is served directly by Better Auth under `/api/auth/*`. These endpoints intentionally
return Better Auth's response bodies, cookies, and error shapes rather than the Nest response
envelope used by `/api/v1/*`.

All browser requests must use credentials so the HttpOnly session cookie is stored and returned.
`status` and `avatarKey` are server-owned fields and are rejected as signup input.

| Endpoint                       | Purpose                                  | Required JSON body                                  | Success                                                  |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------- | -------------------------------------------------------- |
| `POST /api/auth/sign-up/email` | Create an Advisee account and session    | `name`, `fullName`, `email`, `password`, `timezone` | `200`; returns `user` and sets the session cookie        |
| `POST /api/auth/sign-in/email` | Create a session for an existing account | `email`, `password`                                 | `200`; returns `user` and sets the session cookie        |
| `GET /api/auth/get-session`    | Read the current session                 | none                                                | `200`; returns `{ session, user }` or `null`             |
| `POST /api/auth/sign-out`      | End the current session                  | none                                                | `200`; returns `{ success: true }` and clears the cookie |

`name` maps to the platform display name. `fullName` is the legal name and must never be included in
public advisor responses. A newly registered user is always an Advisee; Advisor access is gained
only through `POST /api/v1/advisors/me`.

### Signup — copy this body

`POST /api/auth/sign-up/email`

```json
{
  "name": "Somchai P.",
  "fullName": "Somchai Prasert",
  "email": "somchai@example.com",
  "password": "use-a-long-unique-password",
  "timezone": "Asia/Bangkok"
}
```

`name`, `fullName`, `email`, `password`, and `timezone` are all required. Do **not** send `status`,
`avatarKey`, `id`, or a role: the server creates an `ACTIVE` Advisee account. On success, Better
Auth returns a raw body containing `user` and sets the HttpOnly session cookie.

```bash
curl -i -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Somchai P.","fullName":"Somchai Prasert","email":"somchai@example.com","password":"use-a-long-unique-password","timezone":"Asia/Bangkok"}'
```

### Sign in — copy this body

`POST /api/auth/sign-in/email`

```json
{
  "email": "somchai@example.com",
  "password": "use-a-long-unique-password"
}
```

Optional: `rememberMe` (`true` by default) and `callbackURL`. Sign-in sets the session cookie.

```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"somchai@example.com","password":"use-a-long-unique-password"}'
```

### Use the session cookie

There is no request body for `GET /api/auth/get-session`, `POST /api/auth/sign-out`, or protected
`/api/v1/*` requests. Send the cookie received from signup/sign-in.

```bash
# Current user session
curl -b cookies.txt http://localhost:3000/api/auth/get-session

# Upgrade an Advisee to Advisor — this is a normal Nest API and uses the response envelope
curl -b cookies.txt -X POST http://localhost:3000/api/v1/advisors/me \
  -H "Content-Type: application/json" \
  -d '{"headline":"Operations advisor","bio":"Helping teams improve."}'

# End the session
curl -b cookies.txt -X POST http://localhost:3000/api/auth/sign-out
```

For browser clients, use `credentials: 'include'` with `fetch`, or `withCredentials: true` with
Axios; otherwise the browser discards or withholds the session cookie.

### Testing the API

Use Postman (or curl) for the complete auth flow: sign in and let its cookie jar retain
`better-auth.session_token`, then call protected `/api/v1/*` routes in the same client. Swagger
documents those routes and can execute them only after the browser already holds a valid session
cookie for `localhost:3000`. It deliberately has no **Authorize** value field: a browser cannot
safely paste an HttpOnly cookie into Swagger's JavaScript request.

## 3. Roles

| Role      | Who                                        | How you get it                                                       |
| --------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `Guest`   | no session                                 | default                                                              |
| `Advisee` | any signed-up user                         | **default on signup**                                                |
| `Advisor` | advisee who explicitly upgraded to advisor | creates an advisor profile; verification is a separate trust process |
| `Admin`   | platform staff                             | seeded, never self-service                                           |

An Advisor **is** an Advisee — the roles stack. An advisor can book other advisors.

---

## 4. Field-level access rules

These bind every endpoint. They are enforced by **choosing a different response DTO per audience**,
never by conditional fields inside one DTO — a conditional field is how data leaks.

| Field                               | Guest | Advisee     | Advisor (own)             | Admin              |
| ----------------------------------- | ----- | ----------- | ------------------------- | ------------------ |
| `displayName`, `avatarKey`          | ✅    | ✅          | ✅                        | ✅                 |
| `fullName` (legal name)             | ❌    | own only    | own only                  | ✅                 |
| `email`                             | ❌    | own only    | own only                  | ✅                 |
| `nationalId`                        | ❌    | ❌          | ❌ **not even their own** | ❌ _see below_     |
| identity verification _status_      | ✅    | ✅          | ✅                        | ✅                 |
| identity _document_                 | ❌    | ❌          | own only                  | ✅                 |
| skill claim                         | ✅    | ✅          | ✅                        | ✅                 |
| skill proof _document/status_       | ❌    | ❌          | own only                  | ✅                 |
| `penaltyPoints`, off-platform flags | ❌    | ❌          | ❌                        | ✅                 |
| invoice gross                       | ❌    | own only    | own bookings              | ✅                 |
| invoice `platformFeeSatang`, net    | ❌    | ❌          | own bookings              | ✅                 |
| payout account                      | ❌    | ❌          | own only                  | ✅                 |
| screening answers                   | ❌    | own only    | own service only          | ✅                 |
| chat messages / files               | ❌    | member only | member only               | flagged cases only |

**`nationalId` is never returned by any endpoint, to anybody.** It is write-only. An admin
reviewing an identity sees the uploaded document image and a masked form (`x-xxxx-xxxxx-xx-1`), not
the stored value. It exists to be matched and to prevent duplicate accounts, not to be read.

**An advisee never sees another advisee.** There is no endpoint that returns one.

---

## 5. Access matrix — all resources

Written now so the remaining modules have a target to hit.

| Resource                      | Guest | Advisee   | Advisor                | Admin     |
| ----------------------------- | ----- | --------- | ---------------------- | --------- |
| Service search / detail       | R     | R         | R                      | R         |
| Advisor public profile        | R     | R         | R                      | R         |
| Reviews                       | R     | R         | R                      | RD        |
| Categories / skills           | R     | R         | R                      | RW        |
| Own profile                   | —     | RW        | RW                     | RW        |
| Own identity document         | —     | —         | RW                     | R         |
| Advisor's own services        | —     | —         | RWD                    | RD        |
| Timeslots                     | R     | R         | RWD own                | R         |
| Bookings                      | —     | RW own    | R own + status         | RD        |
| Screening requests            | —     | RW own    | R + decide own service | R         |
| Invoices                      | —     | R own     | R own                  | RW        |
| Payouts                       | —     | —         | R own                  | RW        |
| Refund cases                  | —     | RW own    | R own                  | RW        |
| Chat rooms / messages / files | —     | RW member | RW member              | R flagged |
| Off-platform flags            | —     | —         | —                      | RW        |
| User reports                  | —     | W         | W                      | RW        |
| Users (list, suspend)         | —     | —         | —                      | RW        |

`R` read · `W` write · `D` delete · `—` no access at all (404, not 403 — do not confirm existence)

---

## 6. Module: Users

### `GET /api/v1/users/me` — `Advisee`

Returns the authenticated account owner's allowlisted base profile. Every signed-in account is an
Advisee, so this is the stable profile entry point for Advisees, Advisors, and Admins.

```jsonc
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "3f1c...",
    "displayName": "Somchai P.",
    "email": "owner@example.com",
    "emailVerified": false,
    "fullName": "Somchai Prasert",
    "avatarKey": null,
    "timezone": "Asia/Bangkok",
    "roles": ["ADVISEE", "ADVISOR"],
    "createdAt": "2026-08-01T09:00:00.000Z",
    "updatedAt": "2026-08-15T09:00:00.000Z",
  },
}
```

Roles are additive and returned in the stable order `ADVISEE`, `ADVISOR`, `ADMIN`. Advisor-specific
fields remain behind `/api/v1/advisors/me`; they are not conditionally added to this DTO.

### `PATCH /api/v1/users/me` — `Advisee`

Updates the authenticated owner's base profile. Body fields are optional: `displayName`, `fullName`,
and `timezone`. Email, verification state, account status, roles, and `avatarKey` are not accepted.

### `POST /api/v1/users/me/avatar` — `Advisee`

Uploads or replaces the authenticated owner's avatar using `multipart/form-data` with one required
`file` field. Only JPEG, PNG, and WebP files up to 5 MiB are accepted. The API generates the private
SeaweedFS object key and returns `{ "avatarKey": "avatars/<user-id>/<uuid>.webp" }` in the standard
success envelope. Clients cannot provide or choose object keys.

### `GET /api/v1/users/me/avatar` — `Advisee`

Returns a fresh private download URL for the authenticated owner's current avatar:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "url": "http://localhost:9000/advisory-platform/...signed-query...",
    "expiresInSeconds": 300
  }
}
```

The URL is deliberately transient and must not be stored. Requests without an avatar return `404`.

### `DELETE /api/v1/users/me/avatar` — `Advisee`

Clears the authenticated owner's `avatarKey`. This operation is idempotent from the client's
perspective and returns the removed `{ avatarKey }` in the standard success envelope. The API then
best-effort removes the corresponding private SeaweedFS object; a cleanup failure does not restore the
database reference.

### `DELETE /api/v1/users/me` — `Advisee`

Permanently closes the authenticated account and returns the pre-anonymization, allowlisted own-user
profile in the standard success envelope. The operation is atomic:

- all sessions and authentication accounts are deleted immediately;
- the user row is marked `DELETED` and direct identity fields are replaced with non-identifying
  values so FK-bound appointments, invoices, reports, and chat evidence remain valid;
- avatar references, Advisor identity submissions, claimed skills/proof metadata, notifications,
  and email verification records are erased;
- any Advisor profile is anonymized and its services are unpublished.

Consent and transactional/evidence records remain attached only to the pseudonymous internal UUID
where retention is necessary. A subsequent request with the old session receives `401`. The former
email address is no longer retained on the account and may be used for a new signup.

---

## 7. Module: Advisors

### `GET /api/v1/advisors` — `Public`

Search advisors. Backs Discovery. Must return in <3s (QR).

Query: `page`, `limit` (≤100), `skillId`, `categoryId`, `minPriceSatang`, `maxPriceSatang`,
`minRating`, `verifiedOnly` (bool), `q` (free text over displayName + headline).

Ordering is rule-based, not AI: category match, then rating, then popularity. Off-platform contact
detection uses versioned regex patterns. Advisors with confirmed flags are ranked down — **silently**. The response never reveals that a
penalty was applied.

```jsonc
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [
      {
        "advisorId": "3f1c...",
        "displayName": "Somchai P.",
        "avatarKey": "avatars/3f1c.webp",
        "headline": "Manufacturing ops, 12 yrs",
        "badge": "IDENTITY_VERIFIED", // derived, see ER.README
        "skills": [
          {
            "skillId": "9a2...",
            "name": "Lean manufacturing",
          },
        ],
        "rating": 4.6,
        "reviewCount": 23,
        "priceFromSatang": 150000,
      },
    ],
    "total": 128,
    "page": 1,
    "limit": 20,
    "totalPages": 7,
  },
}
```

### `GET /api/v1/advisors/:id` — `Public`

Public profile: headline, bio, all claimed skills, published services, rating summary.

Never includes `fullName`, `email`, `nationalId`, `penaltyPoints`, or any document.

`404` if the advisor does not exist, is `SUSPENDED`, or has never published a service.
Suspension returns 404 rather than 403 — a 403 confirms the account exists.

### `GET /api/v1/advisors/:id/reviews` — `Public`

Paginated. Reviewer identified by `displayName` only. Includes `advisorReply` when present.

### `POST /api/v1/advisors/me` — `Advisee`

Upgrade self to advisor. Every new account starts as an Advisee; there is no role selector or
onboarding wizard. This creates `ADVISOR_PROFILES` for the current user. Identity and skill
verification are separate from receiving the Advisor role.

Body: `headline`, `bio`.
`409` if already an advisor. This means the request is **not** idempotent; the endpoint wording and
its implementation must remain aligned on this policy.

### `GET /api/v1/advisors/me` — `Advisor`

Own profile response only. It has a dedicated allowlist and is not reused for public discovery or
admin lists, which each receive their own response DTO.

Eventually includes everything the public view hides **except** `nationalId`: identity verification
status, own documents, optional skill-proof documents, unpublished services.

Deliberately excludes `penaltyPoints` — an advisor who can see their score will optimise against
the detector rather than stop.

### `PATCH /api/v1/advisors/me` — `Advisor`

Body: `headline`, `bio`. Both optional.

### `PUT /api/v1/advisors/me/skills` — `Advisor`

Replaces the claimed skill set. Body: `{ "skillIds": ["uuid", ...] }`.

Removing a skill soft-deletes its proof documents. Re-adding it restores only the skill claim, not
previous proof documents.

`400` if any `skillId` is unknown.

### `POST /api/v1/advisors/me/identity` — `Advisor`

Submit เลขบัตรประชาชน + document scan. `multipart/form-data`.

Fields: `nationalId` (13 digits, checksum-validated), `document` (image/pdf, ≤50MB).

Server: validates checksum → hashes → checks `nationalIdHash` uniqueness → encrypts → stores the
scan in SeaweedFS → sets `verificationStatus = SUBMITTED`.

Response echoes **status only**. Never the ID, never a document URL.

```jsonc
{
  "statusCode": 201,
  "message": "Identity submitted for review",
  "data": {
    "verificationStatus": "SUBMITTED",
    "submittedAt": "2026-08-06T14:22:00+07:00",
  },
}
```

| Code | When                                                                         |
| ---- | ---------------------------------------------------------------------------- |
| 400  | Checksum fails, or file too large / wrong type                               |
| 409  | `nationalIdHash` already used by another account                             |
| 409  | Current status is `SUBMITTED` or `VERIFIED` — resubmit only after `REJECTED` |

### `POST /api/v1/advisors/me/skills/:skillId/proof` — `Advisor`

Upload a certificate for one claimed skill. `multipart/form-data`, ≤50MB.
Creates an optional proof-document record with `PENDING` review status. It does not change the
claimed skill or public profile.

`404` if the advisor has not claimed that skill.

### `GET /api/v1/admin/advisors/pending` — `Admin`

Verification queue: identity submissions and skill proofs awaiting review, oldest first.
Includes `fullName` and a **masked** national ID. Includes signed, short-lived document URLs.

### `PATCH /api/v1/admin/advisors/:id/identity` — `Admin`

Body: `{ "decision": "VERIFIED" | "REJECTED", "rejectionReason": "string" }`
`rejectionReason` required when rejecting. Emits a `VERIFICATION_DECIDED` notification.

`409` if the current status is not `SUBMITTED`.

### `PATCH /api/v1/admin/advisors/:id/skills/:skillId/proof` — `Admin`

Body: `{ "decision": "APPROVED" | "REJECTED", "rejectionReason": "string" }`
The decision updates the submitted document's review status only. It does not change the skill
claim or any public badge.

---

## 8. Module: Chat

Chat rooms are created only by the appointment or granted-trial workflows. There is no public
room-create or membership-management endpoint. Until those upstream workflows are implemented,
tests and operational fixtures may create their linked room records directly; clients may not.

Every HTTP route and socket event below requires an `ACTIVE` Better Auth cookie session. A user who
is not a room member receives `404`, not `403`, so room UUID probing does not reveal whether a room
exists.

### HTTP history and read model

- `GET /api/v1/chat/rooms?page=1&limit=20` lists only the current user's rooms, newest room first.
  Each item is `{ id, isAnonymous, lastReadAt, unreadCount, createdAt }`. `unreadCount` counts only
  messages from other members strictly after this member's read marker.
- `GET /api/v1/chat/rooms/:chatRoomId/messages?limit=20&cursor=<opaque>` returns member-only
  history, newest message first. Omit `cursor` for the first page, then pass `nextCursor` back
  unchanged while `hasMore` is true. Ties are ordered by UUID so pagination remains stable when
  new messages arrive. Each message is `{ id, chatRoomId, senderUserId, message, createdAt }`.
  Malformed cursors return `400`. Message history does not calculate a total count.
- `PATCH /api/v1/chat/rooms/:chatRoomId/read` accepts `{ "messageId": "uuid" }` and returns
  `{ chatRoomId, memberUserId, messageId, lastReadAt }`. The message must belong to that room.
  Markers only move forward: a delayed request for an older message cannot make later messages
  unread again.

Room listing uses the standard offset-pagination envelope. Message history uses the cursor envelope
`{ items, limit, nextCursor, hasMore }`. Both retain the repository-wide maximum `limit` of 100.

### Socket.IO

Connect to namespace `/chat` on the API origin. The browser sends the existing HttpOnly Better Auth
cookie during the Socket.IO handshake; do not put a session token in `auth`, query parameters, or
event payloads. Socket CORS uses the same `TRUSTED_ORIGINS` allowlist as HTTP and allows
credentials. Missing sessions fail the handshake with `401`; inactive accounts fail it with `403`.

Client-to-server events:

| Event        | Payload                     | Successful acknowledgement |
| ------------ | --------------------------- | -------------------------- |
| `chat:join`  | `{ chatRoomId }`            | `{ chatRoomId }`           |
| `chat:leave` | `{ chatRoomId }`            | `{ chatRoomId }`           |
| `chat:send`  | `{ chatRoomId, message }`   | persisted message          |
| `chat:read`  | `{ chatRoomId, messageId }` | updated read state         |

`message` is trimmed, must not be blank, and is limited to 4,000 characters. The server persists it
before emitting `chat:message` to clients currently joined to `chatRoomId`. A read update emits
`chat:read` to the same joined clients. Socket errors use the standard Socket.IO `exception` event
with `{ statusCode, message }`; handshake failures use `connect_error` with that object in `data`.

Room subscriptions are connection-local. After reconnecting, a client lists its rooms, emits
`chat:join` for the visible/active rooms again, and fetches HTTP history. This history reconciliation
is how messages sent during the disconnected interval are recovered; realtime delivery is not
treated as durable acknowledgement.

---

## 9. Agreed booking-domain rules pending endpoint design

The booking, availability, screening, payment, payout, and refund endpoints are not yet written.
Their paths and DTOs must be designed in the corresponding feature modules, but they must preserve
the following agreed behavior.

### Availability and slots

- Each Advisor has exactly one Global Availability configuration: a fixed 30-minute slot interval,
  optional buffer, booking horizon (60 days by default), minimum booking notice, and optional daily
  consultation-minute limit. A minimum notice is stored as minutes even when the UI collects a
  number of minutes, hours, or days.
- An Advisor can own several reusable Availability Profiles. A Service selects one Profile; the
  profile remains soft-deleted rather than erased when it has historical use.
- A Profile has non-overlapping weekly windows, specific-date windows, and full-day or partial-day
  blocked periods. A blocked period always overrides specific-date and weekly availability.
- Candidate start times follow the fixed 30-minute interval. Service and Trial durations need only
  be positive; a duration does not change the start-time grid. Availability is derived; it is not a
  client-managed list of independently bookable slot records.
- A booking blocks the advisor across all of their Services and Profiles through its consultation
  range plus the configured buffer. Daily limits count consultation minutes only, not buffer time.
- A cancellation reopens its original range only when the time remaining still satisfies the
  minimum booking notice. Otherwise it remains unavailable. Every reschedule is a cancellation
  followed by a new booking and refund flow.

### Screening and trial

- A Service with `screeningRequired` requires submitted answers and an Advisor `ACCEPTED` decision
  before an Advisee can select a paid appointment time. A declined request notifies the Advisee.
- Trial is independent from screening. An Advisee may receive one Trial per Service only after the
  Advisor creates a direct grant; a grant has no request/approval status. A granted Trial uses the
  Service's Availability Profile and configured Trial duration.

### Payment, payout, and refund

- Advisees pay the full amount during booking. Invoice amounts and fees are integer satang.
- An invoice becomes payout-eligible seven days after its consultation completes. The current
  payout transfer fee is 2,000 satang; it is recorded on the payout rather than silently inferred.
- Refund requests contain a written reason plus zero or more uploaded evidence files. An Admin
  reviews the request and may contact both participants for additional information.
- When either participant cannot attend, the appointment is cancelled before Omise performs the
  refund. Advisor-originated cancellation also feeds the separate behavior-penalty workflow.

### Explicit Project 1 boundary

- Availability belongs to Advisors only. Advisee calendars, Google Calendar conflict checks, and
  special daylight-saving-time behavior are future work; all persisted appointment timestamps still
  use `timestamptz`.

---

## 10. Not yet written

categories & skills · services & availability · screening · booking · payments &
payouts · refunds · chat files · notifications · trust & safety · admin console

Booking is next — it is the one with the concurrency guarantee, the state machine and the payment
gate, so it will stress this format hardest.
