import type { AppointmentState, TransitionTarget } from './booking-states';

export const BOOKING_MESSAGES = {
  created: 'Booking created',
  notFound: 'Booking not found',
  selfBooking: 'You cannot book your own service',
  unavailable: 'Timeslot is not available',
  conflict: 'Timeslot already booked',
  cancelled: 'Booking cancelled',
  rescheduled: 'Booking rescheduled',
  started: 'Booking started',
  completed: 'Booking completed',
  noShowRecorded: 'Booking marked as a no-show',
  noShowTooEarly: 'A no-show cannot be recorded before the appointment starts',
} as const;

export function invalidTransitionMessage(
  to: TransitionTarget,
  from: readonly AppointmentState[],
): string {
  return `Booking cannot become ${to} unless it is ${from.join(' or ')}`;
}
