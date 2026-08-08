import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { chatRooms } from './chat';
import { services } from './service';

export const screeningStatusEnum = pgEnum('screening_status', [
  'PENDING',
  'ACCEPTED',
  'DECLINED',
]);

export const serviceScreeningQuestions = pgTable(
  'service_screening_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
    question: text('question').notNull(),
    displayOrder: integer('display_order').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const screeningRequests = pgTable(
  'screening_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id),
    adviseeId: uuid('advisee_id')
      .notNull()
      .references(() => user.id),
    status: screeningStatusEnum('status').notNull().default('PENDING'),
    decisionReason: text('decision_reason'),
    // Trial fields are null unless the service has trialEnabled.
    chatRoomId: uuid('chat_room_id').references(() => chatRooms.id),
    trialStartedAt: timestamp('trial_started_at', { withTimezone: true }),
    trialExpiresAt: timestamp('trial_expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  // One trial per advisee per service, ever — see docs/ER.README.md.
  (table) => [
    uniqueIndex('screening_requests_advisee_service_key').on(
      table.adviseeId,
      table.serviceId,
    ),
  ],
);

export const screeningAnswers = pgTable(
  'screening_answers',
  {
    screeningRequestId: uuid('screening_request_id')
      .notNull()
      .references(() => screeningRequests.id),
    questionId: uuid('question_id')
      .notNull()
      .references(() => serviceScreeningQuestions.id),
    answer: text('answer').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.screeningRequestId, table.questionId] }),
  ],
);
