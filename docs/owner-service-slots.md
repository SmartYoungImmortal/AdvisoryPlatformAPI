# Owner access to service slots

`GET /api/v1/services/:serviceId/slots?from=YYYY-MM-DD&to=YYYY-MM-DD` lets a published service's owner inspect its available slots without an accepted screening request. Other viewers still need accepted screening when the service requires it. The owner comes from the stored service, never a caller-supplied advisor ID.

The existing session guard, date-range validation, publication requirement and scheduling calculation remain in force. Owners still cannot book their own service. No new endpoint, schema or database migration is required.

The regression test in `availability.service.spec.ts` fails before the change with `Accepted screening is required before viewing slots` and passes afterward. The companion frontend browser proof checks the owner request through the real API and authenticated Swagger, then checks that an advisee without accepted screening still receives 400. Hidden services remain unavailable through this public slot endpoint.
