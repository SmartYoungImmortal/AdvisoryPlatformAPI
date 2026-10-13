import { crudMessages } from '@/common/constants/crud-messages';

/**
 * The notification center (Figma: Notifications) — the in-app feed every user has. Other features
 * write into it through `NotificationsService.notify()`; this module only reads and marks.
 */
export const NOTIFICATION_MESSAGES = {
  ...crudMessages('Notification'),
  found: 'Notifications found',
  unreadCounted: 'Unread notifications counted',
  read: 'Notification marked as read',
  allRead: 'All notifications marked as read',
  invalidCursor: 'Invalid cursor',
} as const;
