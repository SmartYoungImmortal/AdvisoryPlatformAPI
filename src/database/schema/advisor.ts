import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from '@/database/schema';
import { bytea } from './custom-types';
import { adminProfiles } from '@/database/schema/auth-supplements';

export const identityVerificationStatusEnum = pgEnum(
  'identity_verification_status',
  ['NONE', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
);

export const skillProofReviewStatusEnum = pgEnum('skill_proof_review_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const advisorProfiles = pgTable(
  'advisor_profiles',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => user.id),
    headline: varchar('headline').notNull(),
    bio: text('bio'),
    penaltyPoints: integer('penalty_points').notNull().default(0),
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
      'advisor_profiles_penalty_points_nonnegative',
      sql`${table.penaltyPoints} >= 0`,
    ),
  ],
);

export const advisorIdentity = pgTable('advisor_identity', {
  advisorId: uuid('advisor_id')
    .primaryKey()
    .references(() => advisorProfiles.userId),
  // AES at rest, key from env. Never stored or logged in plaintext — see docs/ER.README.md.
  nationalIdEncrypted: bytea('national_id_encrypted'),
  nationalIdHash: varchar('national_id_hash').unique(),
  documentObjectKey: varchar('document_object_key'),
  verificationStatus: identityVerificationStatusEnum('verification_status')
    .notNull()
    .default('NONE'),
  verifiedByAdminId: uuid('verified_by_admin_id').references(
    () => adminProfiles.userId,
  ),
  rejectionReason: text('rejection_reason'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
});

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  // The admin console's Created by / Updated by; nullable for rows that predate them.
  createdByUserId: uuid('created_by_user_id').references(() => user.id),
  updatedByUserId: uuid('updated_by_user_id').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const advisorSkills = pgTable(
  'advisor_skills',
  {
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.advisorId, table.skillId] })],
);

export const skillProofDocuments = pgTable('skill_proof_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  advisorId: uuid('advisor_id')
    .notNull()
    .references(() => advisorProfiles.userId),
  skillId: uuid('skill_id')
    .notNull()
    .references(() => skills.id),
  objectKey: varchar('object_key').notNull(),
  originalFileName: varchar('original_file_name').notNull(),
  reviewStatus: skillProofReviewStatusEnum('review_status')
    .notNull()
    .default('PENDING'),
  reviewedByAdminId: uuid('reviewed_by_admin_id').references(
    () => adminProfiles.userId,
  ),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
});

/* ---------------------------------------------------------------- background */

// An Advisor's background, as their public profile's About tab shows it: where they have worked,
// where they studied, the languages they work in, and the licences and awards they hold. Each row
// is the Advisor's own words, shown as written (no translation rows), in the order they put it
// (`sortOrder`, lowest first). The Advisor replaces each list whole from their profile editor.

export const languageProficiencyEnum = pgEnum('language_proficiency', [
  'NATIVE',
  'FLUENT',
  'PROFESSIONAL',
  'BASIC',
]);

export const advisorExperiences = pgTable(
  'advisor_experiences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    organization: varchar('organization', { length: 120 }).notNull(),
    startYear: integer('start_year').notNull(),
    startMonth: integer('start_month'),
    // Both null while it is the Advisor's current work.
    endYear: integer('end_year'),
    endMonth: integer('end_month'),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('advisor_experiences_advisor_order_idx').on(
      table.advisorId,
      table.sortOrder,
    ),
    check(
      'advisor_experiences_months_in_range',
      sql`(${table.startMonth} IS NULL OR ${table.startMonth} BETWEEN 1 AND 12) AND (${table.endMonth} IS NULL OR ${table.endMonth} BETWEEN 1 AND 12)`,
    ),
    check(
      'advisor_experiences_ends_after_start',
      sql`${table.endYear} IS NULL OR ${table.endYear} >= ${table.startYear}`,
    ),
  ],
);

export const advisorEducations = pgTable(
  'advisor_educations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId, { onDelete: 'cascade' }),
    institution: varchar('institution', { length: 160 }).notNull(),
    // The degree and its field as one line ("Bachelor of Laws"); null for a course without one.
    degree: varchar('degree', { length: 160 }),
    startYear: integer('start_year'),
    endYear: integer('end_year'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('advisor_educations_advisor_order_idx').on(
      table.advisorId,
      table.sortOrder,
    ),
    check(
      'advisor_educations_ends_after_start',
      sql`${table.startYear} IS NULL OR ${table.endYear} IS NULL OR ${table.endYear} >= ${table.startYear}`,
    ),
  ],
);

export const advisorLanguages = pgTable(
  'advisor_languages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId, { onDelete: 'cascade' }),
    language: varchar('language', { length: 60 }).notNull(),
    proficiency: languageProficiencyEnum('proficiency').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('advisor_languages_advisor_order_idx').on(
      table.advisorId,
      table.sortOrder,
    ),
  ],
);

/** Licences, certificates and awards: what it is, who gave it, and the year. */
export const advisorCredentials = pgTable(
  'advisor_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    issuer: varchar('issuer', { length: 160 }),
    year: integer('year'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('advisor_credentials_advisor_order_idx').on(
      table.advisorId,
      table.sortOrder,
    ),
  ],
);
