import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { chatRooms } from './chat';
import { services } from './service';

export const timeslotStatusEnum = pgEnum('timeslot_status', [
  'OPEN',
  'BLOCKED',
]);

export const appointmentStateEnum = pgEnum('appointment_state', [
  'PENDING_PAYMENT',
  'BOOKED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);

export const serviceTimeslots = pgTable('service_timeslots', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id')
    .notNull()
    .references(() => services.id),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  // OPEN/BLOCKED only expresses what the advisor chose — booked-ness is derived from
  // serviceAppointments, not stored here. See docs/ER.README.md.
  status: timeslotStatusEnum('status').notNull().default('OPEN'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  // TODO(S5): add a Postgres EXCLUDE USING gist constraint on
  // (serviceId, tstzrange(startTime, endTime)) so no-overlap is enforced by the
  // database, not the application — Success Criterion #1, added via raw SQL migration
  // when the booking module lands (see docs/sprint-plan.md, S5).
});

export const serviceAppointments = pgTable('service_appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  timeslotId: uuid('timeslot_id')
    .notNull()
    .references(() => serviceTimeslots.id),
  adviseeId: uuid('advisee_id')
    .notNull()
    .references(() => user.id),
  chatRoomId: uuid('chat_room_id').references(() => chatRooms.id),
  jitsiRoomName: varchar('jitsi_room_name'),
  state: appointmentStateEnum('state').notNull().default('PENDING_PAYMENT'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const serviceReviews = pgTable('service_reviews', {
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
    .defaultNow(),
});
