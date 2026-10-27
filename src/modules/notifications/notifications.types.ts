import type { InferSelectModel } from 'drizzle-orm';
import type { notifications } from '@/database/schema';

export type Notification = InferSelectModel<typeof notifications>;
export type NotificationType = Notification['type'];

/**
 * Input for `NotificationsService.notify()`. `title` and `content` are the Thai
 * text (the source language, kept on the row itself); `en` is the same
 * notification in English. Both are written when it is created, and the reader
 * sees whichever their language is, so every caller passes both.
 */
export interface NotifyInput {
  ownerId: string;
  type: NotificationType;
  title: string;
  content?: string | null;
  en: { title: string; content?: string | null };
  resourceId?: string | null;
}
