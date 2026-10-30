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
  meetingOpened: 'Meeting room ready',
  meetingUnavailable: 'Only a paid booking has a meeting room',
  meetingNotOpen: 'The meeting room opens 10 minutes before the appointment',
  meetingEnded: 'The appointment has ended',
} as const;

/**
 * The session's video call: a Jitsi room on the public Jitsi Meet server, opened in the browser's
 * own tab. A room is reachable by anyone who knows its name, so the name is random and only the
 * booking's two participants are ever given it.
 */
export const MEETING = {
  baseUrl: 'https://meet.jit.si',
  roomPrefix: 'advisory-',
  /** How early a booked appointment's room opens; it closes at the appointment's end. */
  opensMinutesBefore: 10,
} as const;

/**
 * Titles of the notifications (and device pushes) sent when payment confirms a booking, in each
 * language a notification is written in.
 */
export const BOOKING_NOTIFICATION_TITLES = {
  confirmed: {
    th: 'การจองของคุณได้รับการยืนยันแล้ว',
    en: 'Your booking is confirmed',
  },
  received: { th: 'มีการจองใหม่', en: 'You have a new booking' },
} as const;

export function invalidTransitionMessage(
  to: TransitionTarget,
  from: readonly AppointmentState[],
): string {
  return `Booking cannot become ${to} unless it is ${from.join(' or ')}`;
}
