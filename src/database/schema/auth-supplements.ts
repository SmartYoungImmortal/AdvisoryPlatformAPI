import {
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from '@/database/schema';

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'DELETED',
]);

export const pdpaConsents = pgTable(
  'pdpa_consents',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id),
    policyVersion: varchar('policy_version').notNull(),
    consentedAt: timestamp('consented_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.policyVersion] })],
);

export const adminProfiles = pgTable('admin_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
