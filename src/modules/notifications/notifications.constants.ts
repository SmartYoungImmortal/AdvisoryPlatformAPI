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
