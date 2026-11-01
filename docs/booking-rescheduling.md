# Booking-specific rescheduling slots

`GET /api/v1/bookings/:bookingId/reschedule-slots?from=YYYY-MM-DD&to=YYYY-MM-DD` returns replacement times to the booking's advisee. It derives service, advisee and duration from the stored appointment. Callers cannot choose a package or an appointment to exclude.

The existing session guard requires authentication. Another user receives 404, a terminal booking receives 409, and invalid UUIDs, dates, ranges or extra query fields receive 400. Date ranges allow at most 90 inclusive days. Publication, screening, notice, buffers, availability windows and daily limits still apply.

Slot reads and the locked reschedule write use the stored end-minus-start duration. If cancellation releases the original time, only that appointment is removed from the overlap and daily-limit calculation. Late cancellation retains its blocked time. Other appointments always count. Rescheduling keeps the original as cancelled history and returns a new booking ID.

No schema change or new migration is required. Existing migrations must be applied before running the current application. Deploy this API before the companion frontend.

## Verification

Run the existing unit, database integration and HTTP suites against a disposable test database. `test/booking-lifecycle.e2e-spec.ts` covers the authorized read, invalid input, daily capacity, duration after a service edit, terminal history and late-cancellation capacity. `availability.service.spec.ts` also verifies that excluding the original does not remove another booking's block.

The companion frontend's `tests/e2e/booking-reschedule-live.spec.ts` drives four real desktop and phone scenarios with an edited package, daily capacity, a competing booking, new-ID navigation and persisted state after reload. It also executes [local Swagger](http://localhost:3200/api/v1/docs) with an advisee session for 200 and without one for 401. Swagger links require the user's local services. Recordings and screenshots belong in the PR, outside Git.

Browser verification uses unpaid appointments. Existing paid-state and chat assertions do not prove invoice association, receipts or provider payment lifecycle. No deployment is verified, and this change does not close the full frontend booking acceptance issue.
