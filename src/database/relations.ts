import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

/**
 * Central relational-query configuration for Drizzle v2.
 *
 * This is intentionally separate from the table declarations: Drizzle v2 replaces
 * per-table `relations()` exports with one relations object passed to `drizzle()`.
 */
export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
}));
