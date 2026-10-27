import { crudMessages } from '@/common/constants/crud-messages';

/**
 * Messages for the notifications module. Other modules create notifications with
 * `NotificationsService.notify()`; this module lists them and marks them as read.
 */
export const NOTIFICATION_MESSAGES = {
  ...crudMessages('Notification'),
  found: 'Notifications found',
  unreadCounted: 'Unread notifications counted',
  read: 'Notification marked as read',
  allRead: 'All notifications marked as read',
  invalidCursor: 'Invalid cursor',
} as const;

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
