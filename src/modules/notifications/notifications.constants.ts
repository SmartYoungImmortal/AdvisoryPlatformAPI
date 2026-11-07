import { crudMessages } from '@/common/constants/crud-messages';

/**
 * Messages for the notifications module. Other modules create notifications with
 * `NotificationsService.notify()`; this module lists them and marks them as read.
 */
export const NOTIFICATION_MESSAGES = {
  ...crudMessages('Notification'),
  found: 'Notifications found',
  foundOne: 'Notification found',
  upcomingSession: 'Upcoming session',
  unreadCounted: 'Unread notifications counted',
  read: 'Notification marked as read',
  allRead: 'All notifications marked as read',
  invalidCursor: 'Invalid cursor',
  socketUnauthorized: 'Authentication required',
} as const;

/** How often the API looks for sessions that need their "starts soon" reminder. */
export const SESSION_REMINDER_SWEEP_MS = 60_000;

/** The reminder both people get shortly before a session; the content is the service and time. */
export const SESSION_REMINDER_NOTIFICATION = {
  title: 'เซสชันใกล้เริ่มแล้ว',
  en: { title: 'Your session starts soon' },
} as const;

/** The Socket.IO namespace that tells a user's open apps when a notification arrives. */
export const NOTIFICATIONS_NAMESPACE = '/notifications';

export const NOTIFICATION_EVENTS = {
  created: 'notification:new',
} as const;

/** The room every connection of one user joins. */
export function notificationSocketRoom(userId: string): string {
  return `user:${userId}`;
}

/**
 * The welcome a new account gets (`NotificationsService.welcome()`). Every sign-up
 * is an Advisee, so it points them at the expert search, which is why it carries
 * no resource. Accounts that predate it were given theirs by the
 * `welcome-notification-backfill` migration, which also holds the Advisor copy.
 */
export const WELCOME_NOTIFICATION = {
  title: 'ยินดีต้อนรับสู่ Advisory',
  content: 'เริ่มจากหาผู้เชี่ยวชาญที่ใช่สำหรับคำถามของคุณ',
  en: {
    title: 'Welcome to Advisory',
    content: 'Start by finding the right expert for your question',
  },
} as const;
