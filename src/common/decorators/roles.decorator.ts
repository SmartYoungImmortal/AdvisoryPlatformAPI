import { SetMetadata } from '@nestjs/common';

/**
 * Advisee is implicit for every authenticated user. Advisor and Admin are additive roles
 * derived from profile rows by SessionGuard; they are not a mutable role column.
 */
export enum Role {
  Advisee = 'ADVISEE',
  Advisor = 'ADVISOR',
  Admin = 'ADMIN',
}

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
