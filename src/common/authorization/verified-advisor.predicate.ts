import { sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { advisorIdentity } from '@/database/schema';

/**
 * Who counts as an Advisor to everyone else: somebody whose identity an admin has
 * verified. An applicant has an `advisor_profiles` row from the moment they apply,
 * so the profile alone is not the test — this is.
 *
 * One predicate, used by the role resolver and by every public read that lists or
 * books an Advisor's Services, so "approved" cannot mean one thing to the guard and
 * another to discovery. `advisorId` is the column holding the Advisor's user id in
 * the caller's query (`services.advisorId`, `advisorProfiles.userId`, …).
 */
export function isVerifiedAdvisor(advisorId: AnyPgColumn): SQL {
  return sql`exists (
    select 1 from ${advisorIdentity}
    where ${advisorIdentity.advisorId} = ${advisorId}
      and ${advisorIdentity.verificationStatus} = 'VERIFIED'
  )`;
}
