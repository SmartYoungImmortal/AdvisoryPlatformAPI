import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminProfilesRepository } from './admin-profiles.repository';
import { REPORT_MESSAGES, SAFETY_MESSAGES } from './safety.constants';
import { UserReportsRepository } from './user-reports.repository';
import { AdminReportResponseDto } from './dtos/admin-report-response.dto';
import { CreateReportDto } from './dtos/create-report.dto';
import { OwnReportResponseDto } from './dtos/own-report-response.dto';
import { ReportQueryDto } from './dtos/report-query.dto';
import { ResolveReportDto } from './dtos/resolve-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reports: UserReportsRepository,
    private readonly admins: AdminProfilesRepository,
  ) {}

  /**
   * Files a report. The reporter is `user.id` from the session and nothing else.
   *
   * `CreateReportDto` has no reporter field, so there is no client-supplied value to prefer
   * by accident; this method is the only place `reporterUserId` is set, and it reads the
   * session. Reporting yourself is rejected before any write — it is never a real report,
   * and letting it through would put a self-referencing row in a human queue.
   */
  async submit(
    user: SessionUser,
    dto: CreateReportDto,
  ): Promise<OwnReportResponseDto> {
    if (dto.reportedUserId === user.id) {
      throw new BadRequestException(REPORT_MESSAGES.selfReport);
    }

    const reportedDisplayName = await this.reports.findDisplayName(
      dto.reportedUserId,
    );
    if (reportedDisplayName === undefined) {
      throw new BadRequestException(REPORT_MESSAGES.reportedUserNotFound);
    }

    if (
      dto.chatRoomId !== undefined &&
      !(await this.reports.isChatRoomMember(dto.chatRoomId, user.id))
    ) {
      throw new BadRequestException(REPORT_MESSAGES.chatRoomNotFound);
    }

    const created = await this.reports.create({
      reporterUserId: user.id,
      reportedUserId: dto.reportedUserId,
      chatRoomId: dto.chatRoomId ?? null,
      reason: dto.reason,
    });

    return new OwnReportResponseDto({
      id: created.id,
      reportedUserId: created.reportedUserId,
      reportedDisplayName,
      chatRoomId: created.chatRoomId,
      reason: created.reason,
      status: created.status,
      createdAt: created.createdAt,
      resolvedAt: created.resolvedAt,
    });
  }

  /** The caller's own filed reports — scoped by the session id, never by a query parameter. */
  async findMine(
    user: SessionUser,
    query: OffsetPaginationDto,
  ): Promise<PaginatedResult<OwnReportResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.reports.findManyByReporter(user.id, options),
      () => this.reports.countByReporter(user.id),
      (row) => new OwnReportResponseDto(row),
    );
  }

  async findManyForAdmin(
    query: ReportQueryDto,
  ): Promise<PaginatedResult<AdminReportResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.reports.findManyForAdmin(query.status, options),
      () => this.reports.countForAdmin(query.status),
      (row) => new AdminReportResponseDto(row),
    );
  }

  async findOneForAdmin(reportId: string): Promise<AdminReportResponseDto> {
    const row = await this.reports.findOneForAdmin(reportId);
    if (!row) {
      throw new NotFoundException(REPORT_MESSAGES.notFound);
    }
    return new AdminReportResponseDto(row);
  }

  /**
   * The ruling. One conditional UPDATE decides it, so a report already in a terminal state
   * is a 409 and not a second write — the first ruling stands, including which admin made it.
   */
  async resolve(
    admin: SessionUser,
    reportId: string,
    dto: ResolveReportDto,
  ): Promise<AdminReportResponseDto> {
    if (!(await this.admins.exists(admin.id))) {
      throw new ForbiddenException(SAFETY_MESSAGES.adminProfileRequired);
    }

    const resolved = await this.reports.resolveIfOpen(reportId, {
      status: dto.outcome,
      reviewedByAdminId: admin.id,
      resolvedAt: new Date(),
    });
    if (resolved) {
      return new AdminReportResponseDto(resolved);
    }

    // Nothing was updated: the report is either absent or no longer open. One read tells
    // the two apart, and it only runs on the failing path.
    const current = await this.reports.findById(reportId);
    if (!current) {
      throw new NotFoundException(REPORT_MESSAGES.notFound);
    }
    throw new ConflictException(REPORT_MESSAGES.alreadyResolved);
  }
}
