# Review private refund evidence and request status

The advisee's refund flow can now filter their cases by an exact invoice and attach private evidence. Concurrent case creation is serialized by an invoice row lock, so two simultaneous requests produce one201 and one409. Existing resolved cases retain their prior semantics: they do not block a later new case.

Routes under `/api/v1`:

| Route | Permission and result |
| --- | --- |
| `GET /refunds/me?invoiceId=<UUID>` | `refund:readSelf`; filtered paginated cases for the session user only |
| `GET /refunds/:refundCaseId/evidence` | `refund:readSelf`; owner-only evidence metadata |
| `POST /refunds/:refundCaseId/evidence` | `refund:submitSelf`; owner-only multipart field `file`, open case only |
| `GET /refunds/:refundCaseId/evidence-url?objectKey=...` | `refund:readSelf`; owner-only signed download URL |
| `GET /admin/refunds/:refundCaseId/evidence-url?objectKey=...` | `refund:read`; admin signed download URL |

Unknown/foreign cases and files return404. Anonymous callers receive401; an advisee on the admin route receives403. Uploads support JPEG, PNG, WebP and PDF, up to50MiB and five files per case. The parser admits the exact boundary; the next byte returns413. The case row lock enforces the five-file bound under concurrency. Content-addressed keys make an identical retry return existing evidence. Definitively refused attachments clean up their object; uncertain database outcomes retain it and emit a reconciliation warning rather than deleting a possibly committed file. Signed links expire after300seconds. No schema migration is needed.

## Verification

`pnpm test:cov` passed against a fresh disposable local database:707unit+74integration+74e2e=855tests. Aggregate coverage:93.52% statements,80.99% branches,88.54% functions,93.96% lines. Build and lint checks run separately.

`test/refund-evidence.e2e-spec.ts` drives real HTTP/auth/Postgres with the storage boundary stubbed. It verifies filtered ownership, concurrent duplicate submission, unsupported files, missing files, exact50MiB and oversize, deduplicated retries, concurrent five-file capacity, private links, resolved-case refusal and a case approval that leaves the invoice in escrow.

The companion frontend's `refund-request-live.spec.ts` uses real SeaweedFS at desktop1440 and phone390. It verifies cancellation/request/evidence persistence, byte-perfect private downloads, admin preview, approval and rejection. It also drives Swagger at http://localhost:3200/api/v1/docs for evidence-list200 and404. The same local services and an authenticated fixture owner are required. There is no remote-preview or deployment claim.

Run `node --check test/refund-evidence-cleanup.cjs` to syntax-check the local-only browser cleanup helper. It takes a fixture case UUID and requires explicit `REFUND_PROOF_*` database/storage configuration; it never inherits `DATABASE_URL` and refuses remote targets.

CodeRabbit CLI review ran before PR creation with no API findings. All media remains outside Git. Native GitHub upload is unavailable without a connected browser; local screenshots/videos are recorded in the workspace audit folder.
