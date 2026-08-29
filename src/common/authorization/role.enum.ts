/**
 * Roles returned in the authenticated profile. Authorization itself is handled by
 * Better Auth `@UserHasPermission` metadata, not by a custom Nest role decorator.
 */
export enum Role {
  Advisee = 'ADVISEE',
  Advisor = 'ADVISOR',
  Admin = 'ADMIN',
}
