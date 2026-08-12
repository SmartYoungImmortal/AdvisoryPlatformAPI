import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { adminProfiles, user } from './auth';
import { bytea } from './custom-types';

export const identityVerificationStatusEnum = pgEnum(
  'identity_verification_status',
  ['NONE', 'SUBMITTED', 'VERIFIED', 'REJECTED'],
);

export const skillProofReviewStatusEnum = pgEnum('skill_proof_review_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const skillProofLevelEnum = pgEnum('skill_proof_level', [
  'SELF_DECLARED',
  'DOCUMENT_SUBMITTED',
  'ADMIN_VERIFIED',
]);

export const advisorProfiles = pgTable('advisor_profiles', {
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
});

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
    proofLevel: skillProofLevelEnum('proof_level')
      .notNull()
      .default('SELF_DECLARED'),
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
