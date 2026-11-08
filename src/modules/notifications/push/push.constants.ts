import { crudMessages } from '@/common/constants/crud-messages';
import type { NotificationType } from '@/modules/notifications/notifications.types';

export const PUSH_MESSAGES = {
  ...crudMessages('Push subscription'),
  publicKeyFound: 'Push public key found',
  subscribed: 'Push subscription saved',
  unsubscribed: 'Push subscription removed',
} as const;

/** Seconds a push service may hold a message for a device that is offline. */
export const PUSH_TTL_SECONDS = 60 * 60 * 24;

/** The app page a tapped notification opens, by notification type. */
const PUSH_URLS: Record<NotificationType, string> = {
  BOOKING_CONFIRMED: '/bookings',
  BOOKING_RECEIVED: '/work/calendar',
  PAYMENT_SUCCEEDED: '/transactions',
  PAYOUT_SENT: '/earnings',
  REVIEW_RECEIVED: '/reviews',
  SESSION_REMINDER: '/bookings',
  NEW_MESSAGE: '/chat',
  SCREENING_REQUESTED: '/screening/requests',
  SCREENING_DECIDED: '/bookings',
  VERIFICATION_DECIDED: '/advisor/profile',
  POLICY_WARNING: '/notifications',
  // Never pushed (`NotificationsService.welcome()`); the Advisee welcome's page, for completeness.
  WELCOME: '/search',
  // Sent to whichever side did not cancel, so it opens the list both sides have.
  BOOKING_CANCELLED: '/notifications',
  BOOKING_RESCHEDULED: '/work/calendar',
  REFUND_DECIDED: '/transactions',
  PAYOUT_FAILED: '/earnings',
  SKILL_PROOF_DECIDED: '/advisor/profile',
  SCREENING_EXPIRED: '/bookings',
  REVIEW_REPLIED: '/bookings',
  REPORT_RESOLVED: '/notifications',
  PAYMENT_FAILED: '/transactions',
};

export function pushUrlFor(type: NotificationType): string {
  return PUSH_URLS[type];
}
