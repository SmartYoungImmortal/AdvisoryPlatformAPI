import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  user,
  chatMessages,
  chatRooms,
  adminProfiles,
} from '@/database/schema';

export const offPlatformFlagStatusEnum = pgEnum('off_platform_flag_status', [
  'PENDING_REVIEW',
  'CONFIRMED',
  'DISMISSED',
]);

export const userReportStatusEnum = pgEnum('user_report_status', [
  'OPEN',
  'ACTIONED',
  'DISMISSED',
]);

export const offPlatformFlags = pgTable(
  'off_platform_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => chatMessages.id),
    matchedPattern: varchar('matched_pattern').notNull(),
    status: offPlatformFlagStatusEnum('status')
      .notNull()
      .default('PENDING_REVIEW'),
    reviewedByAdminId: uuid('reviewed_by_admin_id').references(
      () => adminProfiles.userId,
    ),
    penaltyPointsApplied: integer('penalty_points_applied')
      .notNull()
      .default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  },
  (table) => [
    check(
      'off_platform_flags_penalty_points_nonnegative',
      sql`${table.penaltyPointsApplied} >= 0`,
    ),
  ],
);

export const userReports = pgTable('user_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterUserId: uuid('reporter_user_id')
    .notNull()
    .references(() => user.id),
  reportedUserId: uuid('reported_user_id')
    .notNull()
    .references(() => user.id),
  chatRoomId: uuid('chat_room_id').references(() => chatRooms.id),
  reason: text('reason').notNull(),
  status: userReportStatusEnum('status').notNull().default('OPEN'),
  reviewedByAdminId: uuid('reviewed_by_admin_id').references(
    () => adminProfiles.userId,
  ),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});
