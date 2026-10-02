import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, inArray, type SQL } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { advisorIdentity, user } from '@/database/schema';
import type { IdentityVerificationQueryDto } from './dtos/identity-verification-query.dto';
import type { IdentityVerificationRow } from './dtos/identity-verification-response.dto';
import type { OwnIdentityVerificationRow } from './dtos/own-identity-verification-response.dto';
import type { IdentityVerificationStatus } from './identity-verification.constants';

/**
 * The columns a ruling writes, spelled out rather than taken as a
 * `PgUpdateSetSource<typeof advisorIdentity>`.
 *
 * That is the point: a decision cannot name `nationalIdEncrypted` or
 * `nationalIdHash`, so no future caller can reach the sensitive pair through this
 * repository's write path either.
 */
export interface IdentityDecision {
  verificationStatus: IdentityVerificationStatus;
  rejectionReason: string | null;
  verifiedByAdminId: string;
  verifiedAt: Date | null;
}

/**
 * Not an `EntityRepository` — `advisor_identity`'s PK is `advisorId` (a 1:1 extension
 * of the Advisor, per docs/ER.README.md's no-surrogate-id list), so it has no `id`
 * column for the generic base to key off of.
 *
 * Every select here is an explicit column list. `nationalIdEncrypted` and
 * `nationalIdHash` are never among them, so the sensitive pair does not reach the
 * service layer at all and cannot be leaked by a DTO that spreads a row.
 */
@Injectable()
export class IdentityVerificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * One page of the queue, oldest submission first so an Advisor who has waited
   * longest is at the top and paging is stable. A record that has never been
   * submitted has a null `submittedAt`, which Postgres sorts last in ascending
   * order — after everything actually waiting, which is where it belongs.
   */
  findManyForAdmin(
    query: IdentityVerificationQueryDto,
    options: { limit: number; offset: number },
  ): Promise<IdentityVerificationRow[]> {
    return this.selectForAdmin(this.queueWhere(query))
      .orderBy(asc(advisorIdentity.submittedAt), asc(advisorIdentity.advisorId))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same join the page uses, not over `advisor_identity` alone.
   *
   * The join is what makes this worth writing out. `GET /api/v1/services` answered
   * 500 for every request because its count selected `from(services)` while the
   * predicate read `user` columns, and Postgres rejects a WHERE naming a table absent
   * from the FROM. Even where the filter touches only `advisor_identity`, as it does
   * today, an inner join can drop rows: a record whose `user` row is gone is not on
   * the page, so it must not be in the total either, or the last page comes back
   * empty.
   */
  async countForAdmin(query: IdentityVerificationQueryDto): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(advisorIdentity)
      .innerJoin(user, eq(user.id, advisorIdentity.advisorId))
      .where(this.queueWhere(query));
    return row?.value ?? 0;
  }

  async findOneForAdmin(
    advisorId: string,
  ): Promise<IdentityVerificationRow | undefined> {
    const [row] = await this.selectForAdmin(
      eq(advisorIdentity.advisorId, advisorId),
    ).limit(1);
    return row;
  }

  /**
   * The owner's view, and also what the service reads to explain a refused ruling —
   * both need the current status and neither needs the advisor's own name joined back
   * on.
   */
  async findOwn(
    advisorId: string,
  ): Promise<OwnIdentityVerificationRow | undefined> {
    const [row] = await this.db
      .select({
        advisorId: advisorIdentity.advisorId,
        verificationStatus: advisorIdentity.verificationStatus,
        documentObjectKey: advisorIdentity.documentObjectKey,
        rejectionReason: advisorIdentity.rejectionReason,
        submittedAt: advisorIdentity.submittedAt,
        verifiedAt: advisorIdentity.verifiedAt,
      })
      .from(advisorIdentity)
      .where(eq(advisorIdentity.advisorId, advisorId))
      .limit(1);
    return row;
  }

  /**
   * Applies a ruling only while the record is still in a status that accepts one, so
   * two admins clicking approve at the same moment cannot both win and no decision
   * needs a read-then-write lock. `false` means the row is gone or somebody ruled
   * first; the service reads the row back to say which.
   *
   * `returning` names one column on purpose — the caller needs to know a row matched,
   * not to receive the record's sensitive columns back from an update.
   */
  async decide(
    advisorId: string,
    acceptedStatuses: readonly IdentityVerificationStatus[],
    decision: IdentityDecision,
  ): Promise<boolean> {
    const rows = await this.db
      .update(advisorIdentity)
      .set(decision)
      .where(
        and(
          eq(advisorIdentity.advisorId, advisorId),
          inArray(advisorIdentity.verificationStatus, [...acceptedStatuses]),
        ),
      )
      .returning({ advisorId: advisorIdentity.advisorId });
    return rows.length > 0;
  }

  /** One shape for every admin-facing response, so the queue and a ruling agree. */
  private selectForAdmin(where: SQL | undefined) {
    return this.db
      .select({
        advisorId: advisorIdentity.advisorId,
        displayName: user.displayName,
        email: user.email,
        verificationStatus: advisorIdentity.verificationStatus,
        documentObjectKey: advisorIdentity.documentObjectKey,
        rejectionReason: advisorIdentity.rejectionReason,
        submittedAt: advisorIdentity.submittedAt,
        verifiedAt: advisorIdentity.verifiedAt,
        verifiedByAdminId: advisorIdentity.verifiedByAdminId,
      })
      .from(advisorIdentity)
      .innerJoin(user, eq(user.id, advisorIdentity.advisorId))
      .where(where)
      .$dynamic();
  }

  private queueWhere(
    query: IdentityVerificationQueryDto,
  ): SQL<unknown> | undefined {
    return query.status
      ? eq(advisorIdentity.verificationStatus, query.status)
      : undefined;
  }
}
