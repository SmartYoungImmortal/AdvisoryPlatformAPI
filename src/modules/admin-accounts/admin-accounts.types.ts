/**
 * One account as the admin console reads it.
 *
 * This is the widest allowlist in the two admin modules, and deliberately so: the console's
 * job is account administration, so it sees the account's own contact and moderation state.
 * It is still an allowlist — `image` (unused in favour of `avatarKey`) is out, and nothing is
 * joined in from `advisor_identity`, whose `national_id_*` columns are encrypted at rest and
 * have no business on this route or any other.
 *
 * Do not reuse this shape for a public or self-service response: `email`, `banReason` and
 * `banExpires` belong to the admin's view only.
 */
export interface AdminAccountRow {
  id: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarKey: string | null;
  timezone: string;
  /** `text` in the schema, so a `string` here — see `admin-accounts.constants.ts`. */
  status: string;
  role: string | null;
  /** Nullable in the schema (`default(false)` without `notNull`); read as "not banned". */
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The detail row adds one fact the list does not carry: whether an advisor profile exists.
 * Carried as the joined primary key rather than a computed boolean so the left join stays
 * plain SQL Drizzle can type, with the mapping to `hasAdvisorProfile` done in the DTO.
 */
export interface AdminAccountDetailRow extends AdminAccountRow {
  advisorProfileUserId: string | null;
}
