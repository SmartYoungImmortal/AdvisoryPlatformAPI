import type {
  offPlatformFlagStatusEnum,
  userReportStatusEnum,
} from '@/database/schema';

export type UserReportStatus = (typeof userReportStatusEnum.enumValues)[number];
export type OffPlatformFlagStatus =
  (typeof offPlatformFlagStatusEnum.enumValues)[number];

/**
 * The one status a queue row can still be ruled on, and the rulings themselves.
 *
 * Both lists are checked against the pgEnum with `satisfies`, so a value renamed in
 * `src/database/schema/safety.ts` fails the build here instead of silently producing a
 * predicate that matches nothing. A ruling is irreversible: every status outside the
 * open one is terminal, which is what makes a second ruling a 409 rather than a write.
 */
export const REPORT_OPEN_STATUS = 'OPEN' satisfies UserReportStatus;
export const REPORT_OUTCOMES = [
  'ACTIONED',
  'DISMISSED',
] as const satisfies readonly UserReportStatus[];
export type ReportOutcome = (typeof REPORT_OUTCOMES)[number];

export const FLAG_PENDING_STATUS =
  'PENDING_REVIEW' satisfies OffPlatformFlagStatus;
export const FLAG_OUTCOMES = [
  'CONFIRMED',
  'DISMISSED',
] as const satisfies readonly OffPlatformFlagStatus[];
export type OffPlatformFlagOutcome = (typeof FLAG_OUTCOMES)[number];

/** Confirming a flag is what a penalty answers; a dismissal has nothing to penalise. */
export const FLAG_CONFIRMED_STATUS =
  'CONFIRMED' satisfies OffPlatformFlagOutcome;

export const REPORT_MESSAGES = {
  notFound: 'Report not found',
  submitted: 'Report submitted',
  resolved: 'Report resolved',
  selfReport: 'You cannot report yourself',
  alreadyResolved: 'Report has already been resolved',
  reportedUserNotFound: 'Reported user not found',
  chatRoomNotFound: 'Chat room not found',
} as const;

export const OFF_PLATFORM_FLAG_MESSAGES = {
  notFound: 'Off-platform flag not found',
  resolved: 'Off-platform flag resolved',
  alreadyReviewed: 'Off-platform flag has already been reviewed',
  penaltyRequiresConfirmation:
    'Penalty points can only be applied to a confirmed flag',
} as const;

/**
 * `user_reports.reviewed_by_admin_id` and `off_platform_flags.reviewed_by_admin_id` both
 * reference `admin_profiles.user_id`, not `user.id`. A session that holds the admin
 * permission but has no `admin_profiles` row would make the ruling fail as a foreign-key
 * violation, i.e. a 500 on a request that was authorised — so the ruling refuses first,
 * and says which row is missing.
 */
export const SAFETY_MESSAGES = {
  adminProfileRequired:
    'Ruling requires an admin profile row for the signed-in admin',
} as const;
