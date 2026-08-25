import {
  check,
  date,
  integer,
  pgTable,
  time,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { advisorProfiles } from './advisor';

/** One advisor-wide scheduling policy, shared by every service. */
export const advisorGlobalAvailability = pgTable(
  'advisor_global_availability',
  {
    advisorId: uuid('advisor_id')
      .primaryKey()
      .references(() => advisorProfiles.userId),
    // Fixed platform policy for Project 1; advisors cannot change it.
    slotIntervalMinutes: integer('slot_interval_minutes').notNull().default(30),
    bufferMinutes: integer('buffer_minutes').notNull().default(0),
    bookingHorizonDays: integer('booking_horizon_days').notNull().default(60),
    minimumBookingNoticeMinutes: integer('minimum_booking_notice_minutes')
      .notNull()
      .default(0),
    // Null means no advisor-wide daily consultation-hours limit.
    dailyConsultationLimitMinutes: integer('daily_consultation_limit_minutes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    modifiedAt: timestamp('modified_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'advisor_global_availability_interval_fixed',
      sql`${table.slotIntervalMinutes} = 30`,
    ),
    check(
      'advisor_global_availability_buffer_nonnegative',
      sql`${table.bufferMinutes} >= 0`,
    ),
    check(
      'advisor_global_availability_horizon_positive',
      sql`${table.bookingHorizonDays} > 0`,
    ),
    check(
      'advisor_global_availability_notice_nonnegative',
      sql`${table.minimumBookingNoticeMinutes} >= 0`,
    ),
    check(
      'advisor_global_availability_daily_limit_positive',
      sql`${table.dailyConsultationLimitMinutes} IS NULL OR ${table.dailyConsultationLimitMinutes} > 0`,
    ),
  ],
);

/** Reusable advisor-owned schedule. Deletion is soft so booked appointments keep their history. */
export const availabilityProfiles = pgTable('availability_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  advisorId: uuid('advisor_id')
    .notNull()
    .references(() => advisorProfiles.userId),
  name: varchar('name').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Multiple non-overlapping windows may be configured for each day of the week. */
export const availabilityWeeklyWindows = pgTable(
  'availability_weekly_windows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    availabilityProfileId: uuid('availability_profile_id')
      .notNull()
      .references(() => availabilityProfiles.id),
    // ISO day of week: Monday = 1 through Sunday = 7.
    dayOfWeek: integer('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
  },
  (table) => [
    check(
      'availability_weekly_windows_day_of_week_range',
      sql`${table.dayOfWeek} BETWEEN 1 AND 7`,
    ),
    check(
      'availability_weekly_windows_end_after_start',
      sql`${table.endTime} > ${table.startTime}`,
    ),
  ],
);

/** Extra availability on an individual date, including normally unavailable weekdays. */
export const availabilitySpecificWindows = pgTable(
  'availability_specific_windows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    availabilityProfileId: uuid('availability_profile_id')
      .notNull()
      .references(() => availabilityProfiles.id),
    availableDate: date('available_date').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
  },
  (table) => [
    check(
      'availability_specific_windows_end_after_start',
      sql`${table.endTime} > ${table.startTime}`,
    ),
  ],
);

/** A full-day or partial-day exception. Blocked windows always override specific availability. */
export const availabilityBlockedPeriods = pgTable(
  'availability_blocked_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    availabilityProfileId: uuid('availability_profile_id')
      .notNull()
      .references(() => availabilityProfiles.id),
    blockedDate: date('blocked_date').notNull(),
    startTime: time('start_time'),
    endTime: time('end_time'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'availability_blocked_periods_time_range_valid',
      sql`(${table.startTime} IS NULL AND ${table.endTime} IS NULL) OR (${table.startTime} IS NOT NULL AND ${table.endTime} IS NOT NULL AND ${table.endTime} > ${table.startTime})`,
    ),
  ],
);
