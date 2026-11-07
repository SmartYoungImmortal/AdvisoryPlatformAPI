import type { InferSelectModel } from 'drizzle-orm';
import type { notifications, serviceAppointments } from '@/database/schema';

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

/** The user's next session, with both people's names, for the mobile session banner. */
export interface UpcomingSessionRow {
  bookingId: string;
  startTime: Date;
  endTime: Date;
  state: InferSelectModel<typeof serviceAppointments>['state'];
  advisorId: string;
  adviseeId: string;
  serviceName: string;
  advisorName: string;
  adviseeName: string;
}

/** A session whose reminder this API instance has just claimed. */
export interface ClaimedReminder {
  bookingId: string;
  serviceId: string;
  advisorId: string;
  adviseeId: string;
  startTime: Date;
}

/** Input for `NotificationsService.deliver()`: the Thai text and what it is about. */
export type DeliveryInput = Pick<
  NotifyInput,
  'ownerId' | 'type' | 'title' | 'content' | 'resourceId'
>;
