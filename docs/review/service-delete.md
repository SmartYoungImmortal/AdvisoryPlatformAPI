# Review service deletion with configuration and history

An unused service with screening questions previously failed deletion with HTTP 500 because its question rows still referenced it. Deletion now removes unused questions and image metadata in the same ownership-checked transaction. Consultation, screening-answer or request references still prevent deletion; the transaction rolls back and returns HTTP 409 with an instruction to unpublish instead. Referenced history is never erased.

Use [local Swagger](http://localhost:3200/api/v1/docs), authenticated as the service's advisor, with the disposable proof API and database. Expand `DELETE /api/v1/advisors/me/services/{serviceId}`, choose **Try it out**, enter an owned test service ID and execute. A service with a synthetic consultation returns 409. Remove only the disposable test history, then repeat: an unused service with questions returns 200 and a later owner GET returns 404. No deployed environment is claimed.

The live Swagger proof records both 409 and 200 and checks the returned service ID. The frontend companion records the actual delete dialog at desktop and phone sizes, the localized history blocker and the successful unused-service deletion. Synthetic records do not create provider charges or payouts. Screenshots and videos are attached outside Git history to the PRs.

The existing advisor-service e2e lifecycle was extended before production code changed. It failed with 500 instead of 409. After the fix it checks that blocked deletion preserves the service, all six image objects and its question, then that removing the synthetic history permits deletion and image cleanup. Other-owner checks remain in that lifecycle. The full API run passes 747 unit, 74 integration and 81 e2e tests on a fresh local database separate from the browser proof database.

To repeat the focused API check, start the disposable test Postgres database and migrate it, then set `TEST_DATABASE_URL` to that local test database plus `FRONTEND_URL=http://localhost:3001` and `BACKEND_PUBLIC_URL=http://localhost:3200`. Run `pnpm test:e2e -- test/advisor-services.e2e-spec.ts`. Never point destructive suites at the browser proof database or shared Supabase.

CodeRabbit reviewed the patch before PR creation and reported no findings. The change belongs to Taj's service-management contract. Screening screens, question authoring behavior, payments, and other owners' features are untouched.
