import type { userStatusEnum } from '@/database/schema';
import type { AuthRoles } from '@/modules/auth/auth.config';

/**
 * `user.status` is `text`, not `user_status`.
 *
 * better-auth owns the `user` table and declares `status` as an additional field of type
 * `string` (see `auth.config.ts`), so the column cannot be the pgEnum. The enum is still the
 * vocabulary — `users.repository.ts` writes `'DELETED'` into it, this module writes
 * `'SUSPENDED'` and `'ACTIVE'` — so filters validate against `userStatusEnum.enumValues`
 * while the response type stays `string`, which is what the column can actually hold.
 */
export type UserStatus = (typeof userStatusEnum.enumValues)[number];

export const ACCOUNT_ACTIVE_STATUS = 'ACTIVE' satisfies UserStatus;
export const ACCOUNT_SUSPENDED_STATUS = 'SUSPENDED' satisfies UserStatus;
export const ACCOUNT_DELETED_STATUS = 'DELETED' satisfies UserStatus;

/**
 * The roles a filter may name. Checked against `AuthRoles` with `satisfies`, so renaming a
 * role in `appRoles` fails the build here — and kept as a local literal rather than
 * `Object.keys(appRoles)` so that this DTO never pulls better-auth into its import graph.
 */
export const ACCOUNT_ROLES = [
  'admin',
  'advisor',
  'advisee',
] as const satisfies readonly AuthRoles[];
export type AccountRole = (typeof ACCOUNT_ROLES)[number];

export const ACCOUNT_MESSAGES = {
  notFound: 'Account not found',
  suspended: 'Account suspended',
  reinstated: 'Account reinstated',
  selfSuspend: 'You cannot suspend your own account',
  alreadySuspended: 'Account is already suspended',
  notSuspended: 'Account is not suspended',
  deletedAccount: 'A deleted account cannot be suspended or reinstated',
} as const;
