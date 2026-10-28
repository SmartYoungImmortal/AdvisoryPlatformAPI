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
STORAGE_PROOF_DATABASE_URL=postgresql://advisory:local-proof-only@127.0.0.1:55432/advisory_proof \
node test/storage-live-proof.cjs
```

`STORAGE_PROOF_API_URL` optionally selects local port 3201 for a separately rebuilt API. The default is port 3200. The test verifies real 1 KiB and exact-50 MiB uploads, byte-perfect signed downloads, direct-read denial, membership and authentication checks, unsupported MIME rejection, and oversize rejection without a metadata row. Cleanup failures preserve the original result and write diagnostic evidence.

The frontend's `chat-storage-live.spec.ts` verifies the existing chat controls on desktop and phone. Its `onboarding-storage-live.spec.ts` verifies real applicant uploads and private admin identity/skill review on both viewports. Those changes belong to the companion frontend review.

## Swagger review

With the local API running, open [Swagger](http://localhost:3200/api/v1/docs) using a signed-in demo session. For chat, use a room containing that user and execute `POST /api/v1/chat/rooms/{chatRoomId}/files`. The exact maximum returns 201; one extra byte returns 413. A nonmember receives 404, and a signed-out caller receives 401. Downloads use the permission-checked file route and a short-lived signed URL; an unsigned storage URL is denied.

The local proof passed these request/response cases. The pull request distinguishes HTTP and browser evidence from a Swagger UI recording. There is no remote preview or deployment claim.

Full API checks passed locally: build, lint, 572 unit tests, 49 integration tests and 67 e2e tests. Aggregate coverage was 94.24% statements, 80.55% branches, 89.49% functions and 94.30% lines. The full destructive suites used a separate disposable coverage database, not the seeded proof database or shared Supabase.
