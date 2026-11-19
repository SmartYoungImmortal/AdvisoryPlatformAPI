import { and, eq, ne, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { serviceAppointments } from '@/database/schema';

/**
 * The `service_appointments` rows that use up an Advisee's free trial of a Service: any `TRIAL`
 * booking of it that is not cancelled. A cancelled trial gives the granted trial back, so it can
 * be booked again.
 *
 * One predicate, used by Availability (whether a granted trial can still be booked) and by the
 * trial cards (which booking a trial became), so "used" means the same to both. `serviceId` and
 * `adviseeId` are columns of the caller's query or plain ids.
 */
export function liveTrialBooking(
  serviceId: AnyPgColumn | string,
  adviseeId: AnyPgColumn | string,
): SQL {
  return and(
    eq(serviceAppointments.serviceId, serviceId),
    eq(serviceAppointments.adviseeId, adviseeId),
    eq(serviceAppointments.type, 'TRIAL'),
    ne(serviceAppointments.state, 'CANCELLED'),
  ) as SQL;
}
