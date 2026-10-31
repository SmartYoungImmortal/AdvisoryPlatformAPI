# Advisor calendar and session details

The advisor calendar and session preparation screens now read persisted bookings instead of prototype fixtures. Calendar paging includes all records and uses the advisor’s timezone. Opening a session reads its client, service, state, latest screening submission and exact chat room. Joining uses the existing authenticated meeting API and its time window.

## Review the flow

Local only: [advisor calendar](http://localhost:3001/work/calendar), [Swagger](http://localhost:3200/api/v1/docs). These URLs require the local frontend, API and disposable services; they are not a deployed preview. Sign in as an approved advisor with bookings. Choose a calendar date, open a session, inspect preparation answers, open its chat, and join during the permitted window. Completed/cancelled sessions disable joining. A failed calendar request offers retry.

Run the API on port 3200 against an isolated migrated/seeded local database with SMTP and object storage, then run the frontend on 3001 with `NEXT_PUBLIC_API_URL=http://localhost:3200`. The reproducible real-browser proof is `BOOKING_LIVE_PROOF=1 pnpm exec playwright test tests/e2e/advisor-bookings-live.spec.ts`; it creates/removes disposable fixtures in the local proof database. Do not point it at shared data.

## Evidence and limits

- Real desktop (1440px) and phone (390px) flows passed: 105 persisted appointments, page 2, timezone month boundary, calendar/detail, latest stored screening answer, exact-room chat/messages 200, meeting POST 200 and actual returned room URL, completed/cancelled states, malformed ID, ownership denial, and deliberately interrupted list transport followed by real retry. Browser page errors and horizontal overflow are checked.
- Swagger’s real advisor-detail operation was executed while authenticated and returned the persisted screening/chat identifiers. HTTP tests cover anonymous 401, advisee 403, other advisor 404, malformed UUID 400 and valid owner 200. Pagination defaults/numeric metadata and invalid queries are tested through HTTP.
- API: 861 tests (709 unit, 74 database integration, 78 HTTP); aggregate coverage 93.52% statements, 81.16% branches, 88.66% functions, 94.05% lines. Frontend: 99 unit tests; selected domain/API coverage 97.17% statements/lines, 95.43% branches, 95.16% functions. This does not measure every owned UI. Eleven ordinary browser checks pass. Both production builds, type checks and scoped lint pass.
- CodeRabbit reviewed both changes before PR creation: zero findings. The later desktop header/footer restoration and Swagger proof add no API behavior.
- All proof is local. No deployment or production database migration occurred. Opening the returned public Jitsi URL proves handoff, not a two-person audiovisual call.
- Screening answers are explicitly labelled **latest**. The database has no appointment-to-submission snapshot; do not describe them as the historical answers submitted for that booking.
- Missing participant avatar data uses initials. Missing chat/screening data has an honest unavailable/empty state. No earnings, payment amounts, portraits or answers are invented.

## Visual review

References: [desktop calendar](https://www.figma.com/design/pddSCcCJ1hmYHAZO1GW13b?node-id=1787-26710), [phone calendar](https://www.figma.com/design/pddSCcCJ1hmYHAZO1GW13b?node-id=1374-20803), [desktop session](https://www.figma.com/design/pddSCcCJ1hmYHAZO1GW13b?node-id=1998-29715), [phone session](https://www.figma.com/design/pddSCcCJ1hmYHAZO1GW13b?node-id=1993-34668).

Behavior verdict: Passed locally. Figma verdict: **Differences remain**. Calendar preserves the upstream shared shell, which has wider desktop gutters and a redesigned header/footer and background. Session restores desktop navigation/footer and the two-column content layout, but shares those upstream styles. The latest-submission label adds truthful status/date context; initials replace unavailable profile photos. Exact visual acceptance remains open while the shared redesign preference is unresolved.

Screenshots and browser recordings are retained outside Git in the workspace’s `.audit/advisor-bookings-proof/`. They are not attached or remotely accessible from this document. Native GitHub upload is unavailable in this environment (`gh pr edit` has no attachment option and no browser surface is available); do not mistake local evidence for hosted PR media. Visual review is incomplete until accessible evidence and the shared-shell decision are resolved.
