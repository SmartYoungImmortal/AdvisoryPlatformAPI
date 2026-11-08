# Verify the inclusive 50 MiB upload limit

Chat attachments, identity documents and skill proofs rejected a file exactly at the documented 50 MiB maximum. Busboy emits its limit event at equality. Each multipart interceptor now uses maximum plus one byte; the existing service checks retain the documented maximum.

## Run the controller regression

```bash
TEST_DATABASE_URL=<disposable-local-test-database> pnpm run test:e2e -- --runInBand test/upload-boundary.e2e-spec.ts
```

Three regression cases send real multipart bodies through the production controllers. Each accepts 52,428,800 bytes and rejects 52,428,801 bytes. Service implementations are replaced in this focused test; it does not establish persistence or storage access control.

## Run the real storage proof

Use only the named local proof database, seeded demo accounts, a running API and private SeaweedFS. The script refuses remote databases. It creates its own room and removes its objects and records afterward.

```bash
STORAGE_LIVE_PROOF=1 \
STORAGE_PROOF_PASSWORD="$DEMO_PASSWORD" \
STORAGE_PROOF_DATABASE_URL=postgresql://advisory:local-proof-only@127.0.0.1:55432/advisory_proof \
node test/storage-live-proof.cjs
```

Set `DEMO_PASSWORD` to the password used by your local seed before running this command.

`STORAGE_PROOF_API_URL` optionally selects local port 3201 for a separately rebuilt API. The default is port 3200. The test verifies real 1 KiB and exact-50 MiB uploads, byte-perfect signed downloads, direct-read denial, membership and authentication checks, unsupported MIME rejection, and oversize rejection without a metadata row. Cleanup failures preserve the original result and write diagnostic evidence.

The frontend's `chat-storage-live.spec.ts` verifies the existing chat controls on desktop and phone. Its `onboarding-storage-live.spec.ts` verifies real applicant uploads and private admin identity/skill review on both viewports. Those changes belong to the companion frontend review.

## Swagger review

With the local API running, open [Swagger](http://localhost:3200/api/v1/docs) using a signed-in demo session. For chat, use a room containing that user and execute `POST /api/v1/chat/rooms/{chatRoomId}/files`. The exact maximum returns 201; one extra byte returns 413. A nonmember receives 404, and a signed-out caller receives 401. Downloads use the permission-checked file route and a short-lived signed URL; an unsigned storage URL is denied.

The local proof passed these request/response cases. The pull request distinguishes HTTP and browser evidence from a Swagger UI recording. There is no remote preview or deployment claim.

Build, lint, unit, integration and e2e verification run in the PR's `verify` job, including the aggregate 80% coverage gate. Read the current PR result for exact counts and metrics. Destructive suites use a separate disposable test database, not the seeded proof database or shared Supabase.


## Exact receipt lookup for bookings

The booking sheet now reads `GET /payment/invoices/for-booking/:bookingId`. The API resolves the stored appointment/invoice relation and verifies the booking belongs to the signed-in advisee. This replaces service/time matching against the first 50 invoices. Both sessions on a shared invoice open the same receipt, even when the selected session is not the earliest. Existing receipt layout and invoice session summary remain unchanged. Deploy the API change before the frontend.

Local proof: the new opt-in `booking-invoice-live.spec.ts` follows both booking links into the receipt at 1440px and 390px, with no intercepted network requests. A disposable pending invoice and two appointments are inserted and removed from the named local proof database. A different advisee receives 404 and malformed UUID receives 400. Six repository integration tests, 52 focused payment unit tests, and 88 frontend unit tests pass. Exact Figma comparison remains blocked by sign-in; this is a data-link fix, not visual acceptance. Current screenshots and recording remain outside Git in the workspace audit folder; they are not yet attached to GitHub. Refund request/status UI remains unfinished.


## Service images before publishing

Drafts may have no image. Publishing requires at least one stored service image; the API rejects direct published creation and image-free publish updates with400. The create form saves a draft, uploads selected files, then publishes. It retains the draft id and successful uploads on failure so retrying in the same form does not create another draft. Existing published services are not automatically hidden.

The existing image area now selects and previews JPEG, PNG and WebP files, up to5MiB each and6images per service. Owned image URLs reload from storage. Uploads validate ownership, type/signature and size. A row lock keeps concurrent uploads within the gallery limit. Failed database attachment removes the new object, and service deletion removes its stored images. API routes: GET/POST `/advisors/me/services/:serviceId/images`. Deploy the API before the frontend.

Local review: start at http://localhost:3001/advisor/services/new with an approved advisor and availability profile. Save without an image as a draft; publishing without an image must show the image-required message. Select an image and publish; reload the edit page and check the thumbnail. Six real-API browser scenarios passed across1440px and390px, including draft/publish/hide/delete, limit preservation and create/upload/publish. Both backend service lifecycle HTTP scenarios passed with real Postgres and stubbed storage; the browser proof uses real SeaweedFS. API unit suite674passed before adding two further focused storage-failure tests; all29advisor-service unit tests pass afterward. Frontend88unit tests, TypeScript, targeted lint and production builds pass.

Screenshots and videos are outside Git in `.audit/service-image-2026-10-28`. New GitHub attachment upload is blocked because no browser surface is connected and this gh build has no attachment option. Existing PR media remains; these new media files are local only. Current mobile and desktop renders were inspected. Exact Figma comparison remains unavailable pending sign-in; the existing image-area styling was retained.
