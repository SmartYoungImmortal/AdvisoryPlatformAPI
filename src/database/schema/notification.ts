import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from '@/database/schema';

export const notificationTypeEnum = pgEnum('notification_type', [
  'BOOKING_CONFIRMED',
  'PAYMENT_SUCCEEDED',
  'SESSION_REMINDER',
  'NEW_MESSAGE',
  'SCREENING_REQUESTED',
  'SCREENING_DECIDED',
  'VERIFICATION_DECIDED',
  'POLICY_WARNING',
  'BOOKING_RECEIVED',
  'PAYOUT_SENT',
  'REVIEW_RECEIVED',
]);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => user.id),
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title').notNull(),
    content: text('content'),
    /**
     * The id of the record the notification is about, so the app can open it. The `type` tells
     * which table it belongs to (screening request, Service, chat room, booking…), so there is no
     * foreign key.
     */
    resourceId: uuid('resource_id'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('notifications_owner_created_id_idx').on(
      table.ownerId,
      table.createdAt,
      table.id,
    ),
    // A chat room has at most one unread NEW_MESSAGE notification per user.
    uniqueIndex('notifications_unread_message_owner_resource_key')
      .on(table.ownerId, table.resourceId)
      .where(sql`${table.type} = 'NEW_MESSAGE' AND ${table.isRead} = false`),
  ],
);
