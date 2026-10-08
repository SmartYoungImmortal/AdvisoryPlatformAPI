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
  submitted: 'Skill proof submitted for review',
  applicationRequired:
    'Apply to become an advisor before submitting a skill proof',
  skillNotFound: 'Skill not found',
  fileRequired: 'A proof document file is required',
  fileInvalidType: 'Skill proof must be a JPG, PNG or PDF file',
  fileTooLarge: 'Skill proof must be 50 MB or smaller',
  storageUnavailable: 'File storage is unavailable; try again later',
} as const;

/**
 * Figma's Stage 3 accepts a certificate as a photo or a PDF. The ceiling is the 50 MB
 * the sprint plan names for every upload.
 */
export const MAX_SKILL_PROOF_BYTES = 50 * 1024 * 1024;

export const SKILL_PROOF_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

export function skillProofObjectKey(
  advisorId: string,
  extension: string,
): string {
  return `skill-proofs/${advisorId}/${crypto.randomUUID()}.${extension}`;
}

/** `original_file_name` is unbounded; this keeps a hostile name from bloating the row. */
export const MAX_ORIGINAL_FILE_NAME_LENGTH = 255;

/**
 * Multer hands over the multipart filename decoded as Latin-1, so a Thai name such as
 * `ใบอนุญาต.pdf` arrives as mojibake. The bytes are UTF-8 — every browser sends them
 * that way — so they are re-read as such before anything stores them.
 */
export function decodeUploadedFileName(name: string): string {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.slice(0, MAX_ORIGINAL_FILE_NAME_LENGTH);
}

/**
 * `skill_proof_documents.rejection_reason` is unbounded `text`, so the bound is the
 * API's to choose; it matches the 4,000-character bound this API already documents for
 * a chat message and a review comment.
 */
export const SKILL_PROOF_REJECTION_REASON_MAX_LENGTH = 4_000;
