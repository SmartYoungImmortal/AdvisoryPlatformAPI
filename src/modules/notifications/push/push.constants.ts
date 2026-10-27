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
};

export function pushUrlFor(type: NotificationType): string {
  return PUSH_URLS[type];
}
