import { SetMetadata } from '@nestjs/common';

/**
 * Per docs/api-spec.md §2. `Guest` (no session) never appears in `@Roles(...)` — SessionGuard
 * already rejects unauthenticated requests with 401 before roles are checked. `Advisee` is
 * the default the moment a session exists; `Advisor` and `Admin` are derived by SessionGuard
 * from whether an `advisorProfiles` / `adminProfiles` row exists for the user, not stored as
 * a single column — an advisor is still an advisee, the roles stack.
 */
export enum Role {
  Guest = 'GUEST',
  Advisee = 'ADVISEE',
  Advisor = 'ADVISOR',
  Admin = 'ADMIN',
}

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
