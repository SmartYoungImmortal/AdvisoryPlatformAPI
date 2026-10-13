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
     * The record a notification is about, so a client can open it. What it points at follows from
     * `type` (a screening request, a Service, a chat room, a booking…); there is no foreign key
     * because the target table varies.
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
    // New chat messages collapse into one unread notification per conversation.
    uniqueIndex('notifications_unread_message_owner_resource_key')
      .on(table.ownerId, table.resourceId)
      .where(sql`${table.type} = 'NEW_MESSAGE' AND ${table.isRead} = false`),
  ],
);
