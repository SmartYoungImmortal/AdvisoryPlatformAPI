import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { chatMembers, user, userReports } from '@/database/schema';
import {
  REPORT_OPEN_STATUS,
  type ReportOutcome,
  type UserReportStatus,
} from './safety.constants';
import type { AdminReportRow, OwnReportRow } from './safety.types';

/**
 * `user` appears twice in every report query — once as the reporter, once as the reported
 * party — so each side gets its own alias. Declared at module scope because the alias names
 * are fixed, and reusing one instance keeps the reporter/reported columns identical between
 * the page query and the count that goes with it.
 */
const reporter = alias(user, 'reporter');
const reported = alias(user, 'reported');

@Injectable()
export class UserReportsRepository extends EntityRepository<
  typeof userReports
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, userReports);
  }

  /** One page of the admin queue, newest first so a new report is the first thing seen. */
  async findManyForAdmin(
    status: UserReportStatus | undefined,
    options: { limit: number; offset: number },
  ): Promise<AdminReportRow[]> {
    return this.selectForAdmin()
      .where(this.queueWhere(status))
      .orderBy(desc(userReports.createdAt), desc(userReports.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same two joins `selectForAdmin` uses, not through the inherited
   * `count()`.
   *
   * The predicate only reads `user_reports.status` today, so a plain count over the base
   * table would happen to agree — but the page is an inner join on both `user` aliases, and
   * a count that skipped them would start disagreeing the moment either join or the
   * predicate grows a `user` column. That is exactly how `countPublished` in
   * advisor-services.repository.ts once emitted a WHERE naming a table absent from its
   * FROM and 500'd every request; the count belongs over the page's own joins.
   */
  async countForAdmin(status: UserReportStatus | undefined): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(userReports)
      .innerJoin(reporter, eq(reporter.id, userReports.reporterUserId))
      .innerJoin(reported, eq(reported.id, userReports.reportedUserId))
      .where(this.queueWhere(status));
    return row?.value ?? 0;
  }

  async findOneForAdmin(reportId: string): Promise<AdminReportRow | undefined> {
    const [row] = await this.selectForAdmin()
      .where(eq(userReports.id, reportId))
      .limit(1);
    return row;
  }

  /** One page of the caller's own filed reports, newest first. */
  async findManyByReporter(
    reporterUserId: string,
    options: { limit: number; offset: number },
  ): Promise<OwnReportRow[]> {
    return this.selectForReporter()
      .where(eq(userReports.reporterUserId, reporterUserId))
      .orderBy(desc(userReports.createdAt), desc(userReports.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /** Counted over the same join the reporter's page uses, for the reason above. */
  async countByReporter(reporterUserId: string): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(userReports)
      .innerJoin(reported, eq(reported.id, userReports.reportedUserId))
      .where(eq(userReports.reporterUserId, reporterUserId));
    return row?.value ?? 0;
  }

  /**
   * The ruling, as one conditional UPDATE.
   *
   * `status = OPEN` is part of the WHERE rather than a read the service checks first, so two
   * admins ruling at the same instant cannot both write: Postgres matches one row for one of
   * them and none for the other. `undefined` back therefore means either "no such report" or
   * "already ruled on", which the caller tells apart with one further read.
   */
  async resolveIfOpen(
    reportId: string,
    values: {
      status: ReportOutcome;
      reviewedByAdminId: string;
      resolvedAt: Date;
    },
  ): Promise<AdminReportRow | undefined> {
    const [updated] = await this.updateWhere(
      and(
        eq(userReports.id, reportId),
        eq(userReports.status, REPORT_OPEN_STATUS),
      ) as SQL,
      values,
    );
    return updated ? this.findOneForAdmin(reportId) : undefined;
  }

  /**
   * The reported account's display name, which doubles as its existence check.
   *
   * `reported_user_id` is a foreign key, so a report filed against an id that is not there
   * would fail as a 23503 — a 500 on what is really bad input. One read answers both "does
   * this account exist" and "what is it called", and the caller needs the name for the
   * response anyway.
   */
  async findDisplayName(userId: string): Promise<string | undefined> {
    const [row] = await this.db
      .select({ displayName: user.displayName })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    return row?.displayName;
  }

  /**
   * Whether the reporter is in the room they are citing as evidence.
   *
   * Membership rather than mere existence: a report may only point at a conversation its
   * author was part of, or the field becomes a way to attach strangers' rooms to a
   * complaint. A non-member and a non-existent room are the same answer here, so the route
   * cannot be used to probe which room ids exist.
   */
  async isChatRoomMember(chatRoomId: string, userId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ chatRoomId: chatMembers.chatRoomId })
      .from(chatMembers)
      .where(
        and(
          eq(chatMembers.chatRoomId, chatRoomId),
          eq(chatMembers.memberUserId, userId),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  private queueWhere(status: UserReportStatus | undefined): SQL | undefined {
    return status ? eq(userReports.status, status) : undefined;
  }

  private selectForAdmin() {
    return this.db
      .select({
        id: userReports.id,
        reporterUserId: userReports.reporterUserId,
        reporterDisplayName: reporter.displayName,
        reportedUserId: userReports.reportedUserId,
        reportedDisplayName: reported.displayName,
        chatRoomId: userReports.chatRoomId,
        reason: userReports.reason,
        status: userReports.status,
        reviewedByAdminId: userReports.reviewedByAdminId,
        createdAt: userReports.createdAt,
        resolvedAt: userReports.resolvedAt,
      })
      .from(userReports)
      .innerJoin(reporter, eq(reporter.id, userReports.reporterUserId))
      .innerJoin(reported, eq(reported.id, userReports.reportedUserId))
      .$dynamic();
  }

  private selectForReporter() {
    return this.db
      .select({
        id: userReports.id,
        reportedUserId: userReports.reportedUserId,
        reportedDisplayName: reported.displayName,
        chatRoomId: userReports.chatRoomId,
        reason: userReports.reason,
        status: userReports.status,
        createdAt: userReports.createdAt,
        resolvedAt: userReports.resolvedAt,
      })
      .from(userReports)
      .innerJoin(reported, eq(reported.id, userReports.reportedUserId))
      .$dynamic();
  }
}
