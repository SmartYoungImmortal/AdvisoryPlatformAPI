import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { advisorProfiles, user } from '@/database/schema';
import {
  ACCOUNT_ACTIVE_STATUS,
  ACCOUNT_SUSPENDED_STATUS,
} from './admin-accounts.constants';
import type {
  AdminAccountDetailRow,
  AdminAccountRow,
} from './admin-accounts.types';
import type { AccountQueryDto } from './dtos/account-query.dto';

/**
 * The one field list every route in this module selects and returns.
 *
 * Declared once so the list, the detail read, the suspension and the reinstatement cannot
 * drift apart — and so that adding a column to `user` does not silently add it to four admin
 * responses. `image` is absent on purpose: `auth.config.ts` leaves it unused in favour of
 * `avatarKey`.
 */
const accountColumns = {
  id: user.id,
  displayName: user.displayName,
  email: user.email,
  emailVerified: user.emailVerified,
  fullName: user.fullName,
  avatarKey: user.avatarKey,
  timezone: user.timezone,
  status: user.status,
  role: user.role,
  banned: user.banned,
  banReason: user.banReason,
  banExpires: user.banExpires,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

@Injectable()
export class AdminAccountsRepository extends EntityRepository<typeof user> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, user);
  }

  /** One page of accounts, newest first — a console's list starts at the newest signup. */
  async findManyForAdmin(
    query: AccountQueryDto,
    options: { limit: number; offset: number },
  ): Promise<AdminAccountRow[]> {
    return this.db
      .select(accountColumns)
      .from(user)
      .where(this.listWhere(query))
      .orderBy(desc(user.createdAt), desc(user.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same FROM as the page, which here is `user` alone.
   *
   * `listWhere` reads only `user` columns and the page joins nothing, so the inherited
   * `count()` already covers every column the predicate names — unlike `countPublished` in
   * advisor-services.repository.ts, whose predicate reached into a joined table its count had
   * left out and turned every request into a 500. If this list ever grows a join, this count
   * grows the same one.
   */
  countForAdmin(query: AccountQueryDto): Promise<number> {
    return this.count(this.listWhere(query));
  }

  /** One account plus whether an advisor profile exists for it. */
  async findDetailById(
    userId: string,
  ): Promise<AdminAccountDetailRow | undefined> {
    const [row] = await this.db
      .select({
        ...accountColumns,
        advisorProfileUserId: advisorProfiles.userId,
      })
      .from(user)
      .leftJoin(advisorProfiles, eq(advisorProfiles.userId, user.id))
      .where(eq(user.id, userId))
      .limit(1);
    return row;
  }

  /**
   * The suspension, as one conditional UPDATE.
   *
   * `status = ACTIVE` in the WHERE means a second suspension writes nothing rather than
   * overwriting the first one's reason, and it keeps a `DELETED` account — one
   * `users.repository.ts` has already anonymised — out of reach.
   *
   * Both halves move together: `status` is this platform's own column and `banned` /
   * `ban_reason` are better-auth's, and they are written in the same statement precisely so
   * an account cannot end up suspended for the catalogue but signed in for auth. That
   * coupling is the reason this endpoint exists at all rather than deferring to
   * `POST /api/auth/admin/ban-user`, which cannot see `status`.
   */
  async suspendIfActive(
    userId: string,
    reason: string,
  ): Promise<AdminAccountRow | undefined> {
    const [row] = await this.db
      .update(user)
      .set({
        status: ACCOUNT_SUSPENDED_STATUS,
        banned: true,
        banReason: reason,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(and(eq(user.id, userId), eq(user.status, ACCOUNT_ACTIVE_STATUS)))
      .returning(accountColumns);
    return row;
  }

  /** The mirror image: only a suspended account is reinstated, and it clears the whole ban. */
  async reinstateIfSuspended(
    userId: string,
  ): Promise<AdminAccountRow | undefined> {
    const [row] = await this.db
      .update(user)
      .set({
        status: ACCOUNT_ACTIVE_STATUS,
        banned: false,
        banReason: null,
        banExpires: null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(user.id, userId), eq(user.status, ACCOUNT_SUSPENDED_STATUS)),
      )
      .returning(accountColumns);
    return row;
  }

  /** The status alone, for telling a 404 apart from a 409 on the failing path. */
  async findStatusById(userId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ status: user.status })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row?.status;
  }

  /**
   * `role` is matched exactly, which is what this schema supports: the column is `text`, and
   * better-auth's own `set-role` joins multiple roles into one comma-separated string. An
   * account that was ever given two roles would therefore not match either name here. Every
   * seeded account currently holds a single role, so this is a note rather than a bug — but a
   * multi-role account needs this predicate changed, not the filter's caller.
   */
  private listWhere(query: AccountQueryDto): SQL | undefined {
    const text = query.q?.trim();
    const pattern = text ? `%${this.escapeLikePattern(text)}%` : undefined;

    return and(
      query.status ? eq(user.status, query.status) : undefined,
      query.role ? eq(user.role, query.role) : undefined,
      pattern
        ? or(ilike(user.displayName, pattern), ilike(user.email, pattern))
        : undefined,
    );
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, '\\$&');
  }
}
