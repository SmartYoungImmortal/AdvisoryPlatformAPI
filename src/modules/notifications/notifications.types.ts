import type { InferSelectModel } from 'drizzle-orm';
import type { notifications } from '@/database/schema';

export type Notification = InferSelectModel<typeof notifications>;
export type NotificationType = Notification['type'];

/** Input for `NotificationsService.notify()`. */
export interface NotifyInput {
  ownerId: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  resourceId?: string | null;
}
