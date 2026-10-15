import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, type InferSelectModel, type SQL } from 'drizzle-orm';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { offPlatformFlags } from '@/database/schema';
import {
  FLAG_PENDING_STATUS,
  type OffPlatformFlagOutcome,
  type OffPlatformFlagStatus,
} from './safety.constants';

type OffPlatformFlag = InferSelectModel<typeof offPlatformFlags>;

@Injectable()
export class OffPlatformFlagsRepository extends EntityRepository<
  typeof offPlatformFlags
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, offPlatformFlags);
  }

  /** One page of the flag queue, newest first. */
  async findManyForAdmin(
    status: OffPlatformFlagStatus | undefined,
    options: { limit: number; offset: number },
  ): Promise<OffPlatformFlag[]> {
    return this.db
      .select()
      .from(offPlatformFlags)
      .where(this.queueWhere(status))
      .orderBy(desc(offPlatformFlags.createdAt), desc(offPlatformFlags.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * The inherited `count()` is correct here, and that is worth saying out loud.
   *
   * Unlike the report queue, this page reads one table and its predicate touches only
   * `off_platform_flags.status`, so the count's FROM already covers every column the WHERE
   * names. The rule that broke `countPublished` — a predicate over a joined table counted
   * from the base table alone — cannot apply until this page grows a join, and if it ever
   * does, this count has to grow the same one.
   */
  countForAdmin(status: OffPlatformFlagStatus | undefined): Promise<number> {
    return this.count(this.queueWhere(status));
  }

  /**
   * The ruling, as one conditional UPDATE — see `UserReportsRepository.resolveIfOpen`.
   * `status = PENDING_REVIEW` in the WHERE is what makes a second ruling write nothing.
   */
  async reviewIfPending(
    flagId: string,
    values: {
      status: OffPlatformFlagOutcome;
      reviewedByAdminId: string;
      penaltyPointsApplied: number;
      reviewedAt: Date;
    },
  ): Promise<OffPlatformFlag | undefined> {
    const [updated] = await this.updateWhere(
      and(
        eq(offPlatformFlags.id, flagId),
        eq(offPlatformFlags.status, FLAG_PENDING_STATUS),
      ) as SQL,
      values,
    );
    return updated;
  }

  private queueWhere(
    status: OffPlatformFlagStatus | undefined,
  ): SQL | undefined {
    return status ? eq(offPlatformFlags.status, status) : undefined;
  }
}
