import type { InferSelectModel } from 'drizzle-orm';
import type { serviceAppointments } from '@/database/schema';

export type AppointmentState = InferSelectModel<
  typeof serviceAppointments
>['state'];

/**
 * Every transition the state machine allows, keyed by the value it writes. A transition
 * is applied as a conditional update against these source states, so two simultaneous
 * callers cannot both succeed and no transition needs a read-then-write lock.
 */
export const ALLOWED_SOURCE_STATES = {
  BOOKED: ['PENDING_PAYMENT'],
  IN_PROGRESS: ['BOOKED'],
  COMPLETED: ['IN_PROGRESS'],
  NO_SHOW: ['BOOKED'],
  CANCELLED: ['PENDING_PAYMENT', 'BOOKED'],
} as const satisfies Partial<
  Record<AppointmentState, readonly AppointmentState[]>
>;

export type TransitionTarget = keyof typeof ALLOWED_SOURCE_STATES;

export function canTransition(
  from: AppointmentState,
  to: TransitionTarget,
): boolean {
  return (ALLOWED_SOURCE_STATES[to] as readonly AppointmentState[]).includes(
    from,
  );
}

/**
 * A cancellation reopens its range only when the minimum booking notice is still
 * satisfied. The flag feeds both the partial exclusion constraint and slot derivation,
 * so it is the whole mechanism for giving the time back.
 */
export function reopensAvailability(
  startTime: Date,
  cancelledAt: Date,
  minimumBookingNoticeMinutes: number,
): boolean {
  const noticeRemainingMinutes =
    (startTime.getTime() - cancelledAt.getTime()) / 60000;
  return noticeRemainingMinutes >= minimumBookingNoticeMinutes;
}
