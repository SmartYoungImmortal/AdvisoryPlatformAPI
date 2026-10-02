import type { InferSelectModel } from 'drizzle-orm';
import type { advisorIdentity } from '@/database/schema';

export type IdentityVerificationStatus = InferSelectModel<
  typeof advisorIdentity
>['verificationStatus'];

/**
 * `NONE → SUBMITTED → VERIFIED | REJECTED` (docs/ER.README.md). The two outcomes are
 * terminal: the ruling is what the queue exists for and it happens once, so a second
 * approve or reject is a conflict rather than a write that quietly replaces who
 * decided and when.
 */
export const TERMINAL_IDENTITY_STATUSES = [
  'VERIFIED',
  'REJECTED',
] as const satisfies readonly IdentityVerificationStatus[];

/**
 * The only status a ruling may be made from.
 *
 * `NONE` is excluded deliberately, and is not the same refusal as a terminal one: a
 * record nobody has submitted has no `documentObjectKey` to look at, so approving it
 * would grant the identity badge for nothing. It answers 409 with its own message.
 */
export const DECIDABLE_IDENTITY_STATUSES = [
  'SUBMITTED',
] as const satisfies readonly IdentityVerificationStatus[];

export function isTerminalIdentityStatus(
  status: IdentityVerificationStatus,
): boolean {
  return (
    TERMINAL_IDENTITY_STATUSES as readonly IdentityVerificationStatus[]
  ).includes(status);
}

export const IDENTITY_VERIFICATION_MESSAGES = {
  notFound: 'Identity verification not found',
  approved: 'Identity verification approved',
  rejected: 'Identity verification rejected',
  alreadyDecided: 'Identity verification has already been decided',
  notSubmitted: 'Identity verification has not been submitted yet',
} as const;

/**
 * `advisor_identity.rejection_reason` is unbounded `text`, so the bound is the API's
 * to choose; it matches the one text bound this API already documents, the
 * 4,000-character chat message a review comment also reuses.
 */
export const REJECTION_REASON_MAX_LENGTH = 4_000;
