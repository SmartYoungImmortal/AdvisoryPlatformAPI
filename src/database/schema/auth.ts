import {
  boolean,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'SUSPENDED',
  'DELETED',
]);

/**
 * better-auth's `user` table, hand-written to match exactly what `better-auth generate`
 * would produce (see @better-auth/core's userSchema/sessionSchema/accountSchema/
 * verificationSchema for the canonical base fields) — done by hand rather than via the CLI
 * because `@better-auth/cli` (1.4.21) trails the installed `better-auth` core (1.6.26).
 *
 * uuid ids are non-negotiable repo-wide; `advanced.database.generateId` in auth.config.ts
 * supplies them at the application layer, so every `id` column here is a plain uuid
 * default (`gen_random_uuid()`), not `text`. `fullName`, `avatarKey`, `timezone`, `status`
 * are the ER's domain fields, wired in via `user.additionalFields` in auth.config.ts;
 * `displayName` stands in for better-auth's base `name` field via `user.fields.name`.
 */
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  displayName: varchar('display_name').notNull(),
  image: varchar('image'),
  fullName: varchar('full_name').notNull(),
  avatarKey: varchar('avatar_key'),
  timezone: varchar('timezone').notNull(),
  status: userStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    token: varchar('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: varchar('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: varchar('account_id').notNull(),
    providerId: varchar('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: varchar('scope'),
    // Email/password only; this is the password hash for that provider.
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verification = pgTable(
  'verification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: varchar('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

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
