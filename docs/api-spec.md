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

**Every response has the same envelope.** The frontend unwraps `data` unconditionally.

```jsonc
// success
{ "statusCode": 200, "message": "Success", "data": { ... } }

// paginated — data.items, never a bare array
{ "statusCode": 200, "message": "Success",
  "data": { "items": [...], "total": 128, "page": 1, "limit": 20, "totalPages": 7 } }

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

**Common errors, when applicable:**

| Code | When |
|---|---|
| 401 | No session, or expired |
| 403 | Session valid, role or ownership insufficient |
| 400 | Request validation fails, including an invalid UUID path parameter |
| 429 | Rate limit |
| 500 | Unhandled |

---

## 2. Authentication API

Authentication is served directly by Better Auth under `/api/auth/*`. These endpoints intentionally
return Better Auth's response bodies, cookies, and error shapes rather than the Nest response
envelope used by `/api/v1/*`.

All browser requests must use credentials so the HttpOnly session cookie is stored and returned.
`status` and `avatarKey` are server-owned fields and are rejected as signup input.

| Endpoint | Purpose | Required JSON body | Success |
|---|---|---|---|
| `POST /api/auth/sign-up/email` | Create an Advisee account and session | `name`, `fullName`, `email`, `password`, `timezone` | `200`; returns `user` and sets the session cookie |
| `POST /api/auth/sign-in/email` | Create a session for an existing account | `email`, `password` | `200`; returns `user` and sets the session cookie |
| `GET /api/auth/get-session` | Read the current session | none | `200`; returns `{ session, user }` or `null` |
| `POST /api/auth/sign-out` | End the current session | none | `200`; returns `{ success: true }` and clears the cookie |

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

### Testing without a frontend

Use Postman (or curl) for the complete auth flow: sign in and let its cookie jar retain
`better-auth.session_token`, then call protected `/api/v1/*` routes in the same client. Swagger
documents those routes and can execute them only after the browser already holds a valid session
cookie for `localhost:3000`. It deliberately has no **Authorize** value field: a browser cannot
safely paste an HttpOnly cookie into Swagger's JavaScript request.

## 3. Roles

| Role | Who | How you get it |
|---|---|---|
| `Guest` | no session | default |
| `Advisee` | any signed-up user | **default on signup** |
| `Advisor` | advisee who explicitly upgraded to advisor | creates an advisor profile; verification is a separate trust process |
| `Admin` | platform staff | seeded, never self-service |

An Advisor **is** an Advisee — the roles stack. An advisor can book other advisors.

---

## 4. Field-level access rules

These bind every endpoint. They are enforced by **choosing a different response DTO per audience**,
never by conditional fields inside one DTO — a conditional field is how data leaks.

| Field | Guest | Advisee | Advisor (own) | Admin |
|---|---|---|---|---|
| `displayName`, `avatarKey` | ✅ | ✅ | ✅ | ✅ |
| `fullName` (legal name) | ❌ | own only | own only | ✅ |
| `email` | ❌ | own only | own only | ✅ |
| `nationalId` | ❌ | ❌ | ❌ **not even their own** | ❌ *see below* |
| identity verification *status* | ✅ | ✅ | ✅ | ✅ |
| identity *document* | ❌ | ❌ | own only | ✅ |
| skill `proofLevel` | ✅ | ✅ | ✅ | ✅ |
| skill proof *document* | ❌ | ❌ | own only | ✅ |
| `penaltyPoints`, off-platform flags | ❌ | ❌ | ❌ | ✅ |
| invoice gross | ❌ | own only | own bookings | ✅ |
| invoice `platformFeeSatang`, net | ❌ | ❌ | own bookings | ✅ |
| payout account | ❌ | ❌ | own only | ✅ |
| screening answers | ❌ | own only | own service only | ✅ |
| chat messages / files | ❌ | member only | member only | flagged cases only |

**`nationalId` is never returned by any endpoint, to anybody.** It is write-only. An admin
reviewing an identity sees the uploaded document image and a masked form (`x-xxxx-xxxxx-xx-1`), not
the stored value. It exists to be matched and to prevent duplicate accounts, not to be read.

**An advisee never sees another advisee.** There is no endpoint that returns one.

---

## 5. Access matrix — all resources

Written now so the remaining modules have a target to hit.

| Resource | Guest | Advisee | Advisor | Admin |
|---|---|---|---|---|
| Service search / detail | R | R | R | R |
| Advisor public profile | R | R | R | R |
| Reviews | R | R | R | RD |
| Categories / skills | R | R | R | RW |
| Own profile | — | RW | RW | RW |
| Own identity document | — | — | RW | R |
| Advisor's own services | — | — | RWD | RD |
| Timeslots | R | R | RWD own | R |
| Bookings | — | RW own | R own + status | RD |
| Screening requests | — | RW own | R + decide own service | R |
| Invoices | — | R own | R own | RW |
| Payouts | — | — | R own | RW |
| Refund cases | — | RW own | R own | RW |
| Chat rooms / messages / files | — | RW member | RW member | R flagged |
| Off-platform flags | — | — | — | RW |
| User reports | — | W | W | RW |
| Users (list, suspend) | — | — | — | RW |

`R` read · `W` write · `D` delete · `—` no access at all (404, not 403 — do not confirm existence)

---

## 6. Module: Users

### `GET /api/v1/users/me` — `Advisee`

Returns the authenticated account owner's allowlisted base profile. Every signed-in account is an
Advisee, so this is the stable profile entry point for Advisees, Advisors, and Admins.

```jsonc
{ "statusCode": 200, "message": "Success",
  "data": {
    "id": "3f1c...", "displayName": "Somchai P.", "email": "owner@example.com",
    "emailVerified": false, "fullName": "Somchai Prasert", "avatarKey": null,
    "timezone": "Asia/Bangkok", "roles": ["ADVISEE", "ADVISOR"],
    "createdAt": "2026-08-01T09:00:00.000Z", "updatedAt": "2026-08-15T09:00:00.000Z"
  } }
```

Roles are additive and returned in the stable order `ADVISEE`, `ADVISOR`, `ADMIN`. Advisor-specific
fields remain behind `/api/v1/advisors/me`; they are not conditionally added to this DTO.

### `PATCH /api/v1/users/me` — `Advisee`

Updates the authenticated owner's base profile. Body fields are optional: `displayName`, `fullName`,
and `timezone`. Email, verification state, account status, roles, and `avatarKey` are not accepted.
Avatar writes remain deferred until the MinIO upload path exists.

---

## 7. Module: Advisors

### `GET /api/v1/advisors` — `Public`

Search advisors. Backs Discovery. Must return in <3s (QR).

Query: `page`, `limit` (≤100), `skillId`, `categoryId`, `minPriceSatang`, `maxPriceSatang`,
`minRating`, `verifiedOnly` (bool), `q` (free text over displayName + headline).

Ordering is rule-based, not AI: category match, then rating, then popularity. Advisors with
confirmed off-platform flags are ranked down — **silently**. The response never reveals that a
penalty was applied.

```jsonc
{ "statusCode": 200, "message": "Success",
  "data": { "items": [ {
      "advisorId": "3f1c...", "displayName": "Somchai P.",
      "avatarKey": "avatars/3f1c.webp", "headline": "Manufacturing ops, 12 yrs",
      "badge": "VERIFIED_EXPERT",          // derived, see ER.README
      "skills": [ { "skillId": "9a2...", "name": "Lean manufacturing",
                    "proofLevel": "ADMIN_VERIFIED" } ],
      "rating": 4.6, "reviewCount": 23,
      "priceFromSatang": 150000
  } ], "total": 128, "page": 1, "limit": 20, "totalPages": 7 } }
```

### `GET /api/v1/advisors/:id` — `Public`

Public profile: headline, bio, all skills with `proofLevel`, published services, rating summary.

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
status, own documents, per-skill proof levels, unpublished services.

Deliberately excludes `penaltyPoints` — an advisor who can see their score will optimise against
the detector rather than stop.

### `PATCH /api/v1/advisors/me` — `Advisor`

Body: `headline`, `bio`. Both optional.

### `PUT /api/v1/advisors/me/skills` — `Advisor`

Replaces the claimed skill set. Body: `{ "skillIds": ["uuid", ...] }`.

Skills that survive the replace **keep their `proofLevel`**. New skills start `SELF_DECLARED`.
Removing a skill soft-deletes its proof documents — re-adding it does not silently restore
`ADMIN_VERIFIED`, or a bad actor could launder a verification.

`400` if any `skillId` is unknown.

### `POST /api/v1/advisors/me/identity` — `Advisor`

Submit เลขบัตรประชาชน + document scan. `multipart/form-data`.

Fields: `nationalId` (13 digits, checksum-validated), `document` (image/pdf, ≤50MB).

Server: validates checksum → hashes → checks `nationalIdHash` uniqueness → encrypts → stores the
scan in MinIO → sets `verificationStatus = SUBMITTED`.

Response echoes **status only**. Never the ID, never a document URL.

```jsonc
{ "statusCode": 201, "message": "Identity submitted for review",
  "data": { "verificationStatus": "SUBMITTED", "submittedAt": "2026-08-06T14:22:00+07:00" } }
```

| Code | When |
|---|---|
| 400 | Checksum fails, or file too large / wrong type |
| 409 | `nationalIdHash` already used by another account |
| 409 | Current status is `SUBMITTED` or `VERIFIED` — resubmit only after `REJECTED` |

### `POST /api/v1/advisors/me/skills/:skillId/proof` — `Advisor`

Upload a certificate for one claimed skill. `multipart/form-data`, ≤50MB.
Sets that skill's `proofLevel` to `DOCUMENT_SUBMITTED`.

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
On approve, that skill's `proofLevel` becomes `ADMIN_VERIFIED`. Approving a skill does **not**
touch any other skill.

---

## 8. Not yet written

categories & skills · services · timeslots · screening · booking · payments &
payouts · refunds · chat & files · notifications · trust & safety · admin console

Booking is next — it is the one with the concurrency guarantee, the state machine and the payment
gate, so it will stress this format hardest.
