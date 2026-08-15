import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const notificationTypeEnum = pgEnum('notification_type', [
  'BOOKING_CONFIRMED',
  'PAYMENT_SUCCEEDED',
  'SESSION_REMINDER',
  'NEW_MESSAGE',
  'SCREENING_DECIDED',
  'VERIFICATION_DECIDED',
  'POLICY_WARNING',
]);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => user.id),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title').notNull(),
  content: text('content'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
