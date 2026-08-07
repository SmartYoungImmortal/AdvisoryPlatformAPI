# AdvisoryPlatformAPI — NestJS backend for the Advisory Platform

KMITL final project (Project 1, 2569). This repo is the **API**. Taj owns it alone —
`AdvisoryPlatform/` (Next.js) is the frontend and belongs to Copper, Nam, Phak.

**Read the API as serving the frontend.** The team decided *"Backend ทําตามที่ ux/ui frontend
ขึ้นไปก่อน"* — the UI leads, the API follows. When an endpoint's shape is ambiguous, look at what
the frontend needs, not at what's elegant.

Stack: **NestJS 11 · Drizzle · Postgres · better-auth · MinIO · Socket.IO · Jitsi (self-host) ·
Omise**. Everything self-hosted except Omise.

## Where the docs are

**Project documentation lives in Taj's Obsidian vault, not in this repo.** Sharing with the team
happens through the Drive รวม folder. Do not create a `docs/` folder here.

| Doc | Path |
|---|---|
| API spec — endpoints, roles, field-level access | `C:\Tajdang\Obsidian Vault\src\Areas\KMITL\Advisory API spec.md` |
| Sprint plan | `…\src\Areas\KMITL\Advisory sprint plan.md` |
| Frontend contract | `…\src\Areas\KMITL\Advisory frontend contract.md` |
| Proposal (ข้อเสนอโครงงาน) | `…\src\Areas\KMITL\Advisory proposal.md` |
| Meeting notes | `…\src\Areas\KMITL\Meeting *-2569.md` |

**The data model is the exception — the repo is authoritative:**
`AdvisoryPlatform-Docs/ER.mermaid` + `ER.README.md`. The vault's `Advisory ER.md` is a
convenience copy for reading on a phone; if they disagree, the repo wins.

**Read the ER and the API spec before adding a table or an endpoint.**

---

## Non-negotiables

These exist because a grader checks them or because a decision was already argued and settled.

1. **All money is an integer in satang.** `150.00 THB = 15000`. Omise's unit. Never a float,
   never baht. Column and field names end in `Satang` so a mistake is visible at the call site.
2. **All timestamps are `timestamptz`.** Never a naive local time. Advisors and advisees can be in
   different timezones — two interviewees raised this specifically.
3. **UUID primary keys everywhere**, including better-auth's tables. See "better-auth" below —
   this needs a manual step and it is easy to destroy by accident.
4. **No credentials, tokens, keys or internal IPs in the repo.** `.env.example` carries names only.
5. **Postgres is self-hosted, in Docker.** Never a hosted driver. See "Database" below.
6. **`any` is banned.** If Drizzle can infer it, use the inferred type. See "Types" below.
7. **Junction tables have a composite PK and no surrogate id.** Project Orientation deducts marks
   for it: *"ห้ามใช้ ID ในตารางที่ไม่ใช่ Entity พื้นฐาน"*.
8. **Booking overlap is prevented by a Postgres exclusion constraint**, not by an application-layer
   check. This is Success Criterion #1 and must hold under concurrency.
9. **Coverage ≥ 80%**, gated in CI. Write the test with the feature, not at the end of the sprint.

---

## Layout

```
src/
├─ common/                 cross-cutting, no business logic
│  ├─ decorators/          public, roles, current-user, response-message, api-docs
│  ├─ guards/              session, roles
│  ├─ interceptors/        transform
│  ├─ filters/             all-exceptions
│  ├─ pagination/          offset-pagination.dto, paginate helper
│  ├─ repositories/        entity.repository
│  └─ utils/
├─ config/                 env validation schema + typed config
├─ database/               drizzle client, DRIZZLE token, schema/
│  └─ schema/              auth · advisor · service · booking · screening
│                          payment · chat · safety · notification · index
├─ modules/                one folder per feature
└─ main.ts
```

**There is no `shared/`.** The reference project had both `common/` and `shared/` with no rule
separating them, and a class ended up misfiled in a file called `interfaces.ts` as a result. One
folder, subfoldered by kind.

**Schema is central, not colocated.** The 28 tables are one connected FK graph — payments → booking
→ services → advisors → auth. Colocating per module would make the import graph mirror the FK graph
and invite cycles that break drizzle-kit.

A module folder:

```
modules/booking/
├─ booking.controller.ts
├─ booking.service.ts        business rules — no SQL
├─ booking.repository.ts     queries — no rules
├─ booking.module.ts
├─ dtos/
│  ├─ create-booking.dto.ts
│  ├─ update-booking.dto.ts
│  ├─ booking-query.dto.ts
│  └─ booking-response.dto.ts
├─ booking.service.spec.ts
└─ booking.integration-spec.ts
```

Files are kebab-case. DTO folder is `dtos/`, plural, matching `guards/` and `decorators/`.

---

## Database

**Self-hosted Postgres in Docker. There is no managed database anywhere in this project.**

The team's rule is *"ภาคอยากให้ self host ทั้งหมด มีแค่ omise เท่านั้นที่เป็น third party"*. That includes
the database, MinIO and Jitsi. Omise is the single exception.

```ts
// database/database.module.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const DRIZZLE = Symbol('DRIZZLE');

const pool = new Pool({ connectionString: config.DATABASE_URL });
export const db = drizzle(pool, { schema });
export type DrizzleDB = typeof db;
```

**Do not copy the Neon setup from `dying-message`.** That project used
`@neondatabase/serverless` + `drizzle-orm/neon-http` because it deployed to Cloudflare. We use
`pg` + `drizzle-orm/node-postgres`. `neon-http` also cannot do transactions, which the booking
flow needs.

Local dev is `docker compose up` — Postgres, MinIO and Jitsi. A new developer should need Docker
and nothing else.

## Types

**`any` is banned.** Not discouraged — banned. `@typescript-eslint/no-explicit-any` is an error.

Drizzle infers almost everything. Use it:

```ts
type Booking    = InferSelectModel<typeof appointments>;
type NewBooking = InferInsertModel<typeof appointments>;
type DrizzleDB  = typeof db;              // never `any`
```

`dying-message` typed its repository's `db` as `any`, which erased Drizzle's inference at the one
place the whole layer depends on it. That is the mistake this rule exists to prevent.

If a type genuinely cannot be inferred — a third-party callback, an Omise webhook payload before
validation — use `unknown` and narrow it, and leave a comment saying why. `unknown` forces the
check; `any` skips it silently.

---

## The response envelope

**Every response has the same three keys.** This is the thing to not break — the frontend unwraps
`data` unconditionally.

```jsonc
// success
{ "statusCode": 200, "message": "Success", "data": { ... } }

// failure
{ "statusCode": 409, "message": "Timeslot already booked", "data": null }

// validation failure
{ "statusCode": 400, "message": "Validation failed", "data": null,
  "errors": [ { "property": "email", "message": "email must be an email" } ] }
```

- `TransformInterceptor` (global) wraps successes. It reads `@ResponseMessage('...')` metadata and
  falls back to `'Success'`.
- `AllExceptionsFilter` (global) produces the identical shape for failures, adding `errors[]` for
  field-level problems.

Controllers **return plain values**. Never touch `res` directly — that bypasses the interceptor and
silently produces a different shape.

---

## Data access

**Services hold rules. Repositories hold queries. Neither does the other's job.**

`EntityRepository<T extends PgTable>` in `common/repositories/` provides typed
`findOne / findMany / findById / create / createMany / updateWhere / updateById / deleteWhere /
deleteById / count`. Every module repository extends it and adds its own named queries.

```ts
@Injectable()
export class BookingRepository extends EntityRepository<typeof appointments> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, appointments);
  }

  findConflicting(timeslotId: string) {
    return this.findMany(
      and(eq(appointments.timeslotId, timeslotId), inArray(appointments.state, ACTIVE_STATES)),
    );
  }
}
```

**`db` is typed `DrizzleDB`, never `any`.** The reference project typed it `any` and threw away
Drizzle's inference at the exact place it mattered. Don't repeat that.

**No SQL in a service. No business rule in a repository.** If a service imports from `drizzle-orm`,
it is in the wrong file.

There is deliberately **no** `BaseCrudService`.

This was re-examined on its merits, not dismissed. It would save ~9 lines in a pure-CRUD module —
but only 2 of ~12 modules here are pure CRUD (`skills`, `service-categories`). Everything else has
an ownership rule, a state machine, or both.

The reason it's banned rather than merely unused: a generic base exposes a public
`update(id, dto)` with **no ownership check**. `services` looks like pure CRUD until you remember
an advisor must not edit another advisor's service — and an inherited `update` would allow exactly
that, silently, with nothing in the type system objecting. An authorization bypass that fails open
is not worth 18 lines.

Write the forwarding methods. They are boring on purpose: every write path is visible in the file
that owns it.

---

## Controllers must stay thin

A controller routes, authorizes, and documents. It does not orchestrate.

```ts
@Get(':id')
@ApiGetOne(BookingResponseDto, 'Booking')
findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BookingResponseDto> {
  return this.bookingService.findOne(id);
}
```

**Anti-pattern — do not write this:**

```ts
// ~15 lines of @ApiResponse repeated on every handler, @ApiParam on every :id route,
// then a handler that fetches three entities itself before calling the service.
```

Two rules that kill it:

1. **Swagger noise goes into a composed decorator.** `common/decorators/api-docs.decorator.ts`
   holds `@ApiGetOne`, `@ApiGetPaginated`, `@ApiCreate`, `@ApiUpdate`, `@ApiDelete`, each built with
   `applyDecorators`. Responses that are always true (401 / 403 / 422) are declared **once** via
   `DocumentBuilder().addGlobalResponse(...)` in `main.ts`. Only genuinely specific outcomes get a
   per-handler decorator — `@ApiConflictResponse({ description: 'Timeslot already booked' })`.
2. **A controller injects one service.** If a handler needs a user, an exam and a question before it
   can act, that orchestration belongs in the service. A controller with four injected services is
   the smell.

---

## better-auth

better-auth owns authentication. We own authorization.

- **Mounted, not reimplemented.** `@Controller('api/auth')` with `@All('*path')` hands the whole
  subtree to `toNodeHandler(auth)`. Signup, signin, signout and session are the library's.
- **Body-parser must be disabled on that route**, or the handler receives a consumed stream and
  breaks. This is the failure that costs an afternoon.
- **`SessionGuard` is global** via `APP_GUARD`: resolves `auth.api.getSession()`, attaches the user
  to the request, throws 401. `@Public()` opts a route out. `@Roles(Role.Advisor)` layers on top.
  Auth is opt-out, not opt-in — a forgotten decorator fails closed.
- **`@CurrentUser()`** is how a handler gets the user. Never read `req.user` by hand.
- **Email/password only.** No social login in Project 1.
- **The domain user IS better-auth's user table.** `fullName`, `avatarKey`, `timezone` and `status`
  are declared as `user.additionalFields`. There is no second users table and no sync hook.

### The UUID step — read before running `auth generate`

better-auth's Drizzle adapter emits `text('id')`. We use `uuid`, because the proposal defends UUID
PKs in writing and every one of the 28 ER tables uses them.

After regenerating the auth schema:

1. `advanced.database.generateId` must be `() => crypto.randomUUID()`.
2. Hand-edit the generated file: `text('id')` → `uuid('id').primaryKey().defaultRandom()`, and every
   `text('user_id')` → `uuid('user_id')`.

**`auth generate` overwrites this file.** Re-apply the edit every time, and diff before committing.

No passport, no JWT strategies, no hand-rolled refresh rotation. better-auth's session table is the
source of truth; issuing our own tokens alongside it would create a second one.

---

## DTOs

Three kinds, all in the module's `dtos/`:

- `create-*.dto.ts` / `update-*.dto.ts` — class-validator + `@ApiProperty`. `update` extends
  `PartialType(Create...)`.
- `*-query.dto.ts` — filters, extends `OffsetPaginationDto`.
- `*-response.dto.ts` — a class with a constructor mapping from `InferSelectModel<typeof table>`.

**A response DTO is a whitelist, not a convenience.** It is the only thing standing between a
Drizzle row and the wire. Never return a raw row — that is how a password hash or an internal flag
leaks.

A field being declared three times (column, validator, `@ApiProperty`) is accepted duplication. It
was weighed against deriving DTOs from the schema with `drizzle-zod`; the derivation is DRY-er but
costs a new dependency and an unfamiliar pattern with 8 sprints left.

---

## Pagination

`OffsetPaginationDto` — `page` (default 1), `limit` (default 20, **max 100**), `offset` getter.
List endpoints return `{ items, total, page, limit, totalPages }`.

Chat history uses **cursor** pagination (`?before=<messageId>&limit=50`), built when the Chat module
lands in S7. Offset would show duplicate messages to a reader scrolling while new ones arrive.

---

## Testing

- `*.spec.ts` — unit. Service under test, repository mocked. Carries the coverage number.
- `*.integration-spec.ts` — real Postgres. Reserved for what a mock cannot prove.

Integration tests are mandatory for: **booking concurrency**, **Omise webhook idempotency**,
**better-auth session lifecycle**.

The 20-concurrent-bookings test is not routine — **its output is evidence for the report.** The
proposal promises overlap prevention *"ได้สำเร็จร้อยเปอร์เซ็นต์ในทุกๆ การทำธุรกรรมจองเวลา"*, and the honest
answer to "how did you prove it" cannot be "we mocked the database that would have failed".

---

## Git

`main` (prod) ← `UAT` ← `develop` ← `feature/*`. Branch per issue off `develop`.
**Never commit to `main`.** No code review on this team, so CI is the only gate — don't merge red.

---

## Working with Taj on this repo

- Recommend, don't survey. Pick one and say why.
- Grill before building anything structural.
- Checkpoint commit before anything large or destructive.
- Write one sample before generating thirty of anything.
- Thai and English mix in prose is fine. Code, identifiers and API messages stay English.
