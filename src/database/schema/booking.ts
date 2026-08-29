import {
  boolean,
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
import { user, chatRooms, services, advisorProfiles } from '@/database/schema';

export const appointmentStateEnum = pgEnum('appointment_state', [
  'PENDING_PAYMENT',
  'BOOKED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const appointmentTypeEnum = pgEnum('appointment_type', [
  'CONSULTATION',
  'TRIAL',
]);

export const serviceAppointments = pgTable(
  'service_appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
    // Denormalized for the advisor-wide exclusion constraint. The booking service verifies this
    // matches the selected service's owner before inserting the appointment.
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId),
    adviseeId: uuid('advisee_id')
      .notNull()
      .references(() => user.id),
    type: appointmentTypeEnum('type').notNull().default('CONSULTATION'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    // Snapshots the end of the Service plus the Global Availability buffer at booking time.
    unavailableUntil: timestamp('unavailable_until', {
      withTimezone: true,
    }).notNull(),
    // A cancellation reopens the time only when it still satisfies the minimum-notice rule.
    blocksAvailability: boolean('blocks_availability').notNull().default(true),
    cancelledByUserId: uuid('cancelled_by_user_id').references(() => user.id),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    chatRoomId: uuid('chat_room_id').references(() => chatRooms.id),
    jitsiRoomName: varchar('jitsi_room_name'),
    state: appointmentStateEnum('state').notNull().default('PENDING_PAYMENT'),
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
      'service_appointments_end_after_start',
      sql`${table.endTime} > ${table.startTime}`,
    ),
    check(
      'service_appointments_unavailable_after_end',
      sql`${table.unavailableUntil} >= ${table.endTime}`,
    ),
    check(
      'service_appointments_cancellation_metadata_consistent',
      sql`(${table.cancelledAt} IS NULL AND ${table.cancelledByUserId} IS NULL) OR (${table.cancelledAt} IS NOT NULL AND ${table.cancelledByUserId} IS NOT NULL)`,
    ),
  ],
);

export const serviceReviews = pgTable(
  'service_reviews',
  {
    appointmentId: uuid('appointment_id')
      .primaryKey()
      .references(() => serviceAppointments.id),
    stars: integer('stars').notNull(),
    comment: text('comment'),
    advisorReply: text('advisor_reply'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    modifiedAt: timestamp('modified_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check('service_reviews_stars_range', sql`${table.stars} BETWEEN 1 AND 5`),
  ],
);
