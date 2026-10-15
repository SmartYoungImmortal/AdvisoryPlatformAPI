import type { InferSelectModel } from 'drizzle-orm';
import type { skillProofDocuments } from '@/database/schema';

export type SkillProofReviewStatus = InferSelectModel<
  typeof skillProofDocuments
>['reviewStatus'];

/**
 * `PENDING → APPROVED | REJECTED`. Both outcomes are terminal: the review is what the
 * queue exists for and it happens once, so a second approve or reject is a conflict
 * rather than a write that quietly replaces the reviewer and their reason.
 *
 * Nothing here changes a skill or the public profile. Per docs/ER.README.md, skills
 * are claims and identity is the only verification badge — these documents are an
 * administrative record, so approving one grants nothing.
 */
export const TERMINAL_SKILL_PROOF_STATUSES = [
  'APPROVED',
  'REJECTED',
] as const satisfies readonly SkillProofReviewStatus[];

/** `PENDING` is the whole complement of the terminal pair — the enum has three values. */
export const DECIDABLE_SKILL_PROOF_STATUSES = [
  'PENDING',
] as const satisfies readonly SkillProofReviewStatus[];

export const SKILL_PROOF_MESSAGES = {
  notFound: 'Skill proof not found',
  approved: 'Skill proof approved',
  rejected: 'Skill proof rejected',
  alreadyReviewed: 'Skill proof has already been reviewed',
} as const;

/**
 * `skill_proof_documents.rejection_reason` is unbounded `text`, so the bound is the
 * API's to choose; it matches the 4,000-character bound this API already documents for
 * a chat message and a review comment.
 */
export const SKILL_PROOF_REJECTION_REASON_MAX_LENGTH = 4_000;
