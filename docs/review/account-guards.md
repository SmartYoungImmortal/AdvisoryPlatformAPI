# Account safeguards

Email sign-in counts five failed credentials checks in a rolling 15-minute window, then pauses
that normalized email for 15 minutes across clients. The fifth failure returns HTTP 429 with
`LOGIN_LOCKED` and a positive `retryAfterSeconds`. Unknown emails follow the same behavior.
Expiring private Better Auth verification records store hashed identifiers and failure times;
Postgres transaction advisory locks serialize counter updates. No new table or migration is needed.

`GET /api/v1/users/me/deletion-blockers` now returns `hasUnsettledEarnings`. Deletion returns 409
when an owner has a pending payout or positive-net held/released invoice without a paid payout.
Failed payouts do not settle invoices. The check uses recorded invoice amounts, includes held
funds awaiting eligibility, and runs again inside the deletion transaction. Upcoming appointments
remain blockers. The transaction takes the existing advisor scheduling lock before account locks.

Local Swagger: <http://localhost:3200/api/v1/docs>. With a disposable signed-in account, execute
`GET /api/v1/users/me/deletion-blockers`, observe the earnings flag, and attempt `DELETE /users/me`:
unsettled records yield 409 and leave the account active. Once a payout settles the invoice, the
flag clears and deletion succeeds. Auth endpoints are Better Auth routes outside Swagger; their
HTTP responses are exercised through the real login UI and ESM HTTP tests.

The real browser proof lives in the frontend `tests/e2e/account-guards-live.spec.ts`. It covers both
viewport sizes, private local persistence, expiry recovery, and actual Swagger GET execution. It
advances only a disposable record's expiry and uses synthetic financial rows, without a provider
charge or transfer. No production database or deployed environment is used.

CodeRabbit CLI was requested before opening the PR but could not review the API: the repository
is not connected to an accessible organization plan and the free allowance was exhausted. The
frontend review ran; its actionable timer findings were addressed. Review media is local outside
Git in `.audit/account-guards-proof/`; it is not attached or hosted on GitHub.
