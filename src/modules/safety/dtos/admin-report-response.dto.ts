import { ApiProperty } from '@nestjs/swagger';
import { userReportStatusEnum } from '@/database/schema';
import type { UserReportStatus } from '../safety.constants';
import type { AdminReportRow } from '../safety.types';

/**
 * One report as the moderation console sees it.
 *
 * The allowlist is the point of this class. Two real accounts are named here, and each is
 * named by `id` and `displayName` only. `email`, `fullName`, `banned`, `banReason`, the
 * `advisor_identity` columns and anything else on `user` stay out of this DTO on every
 * route — an admin queue is not a reason to hand the console a person's whole record, and
 * a report row is the last place a reported party's ban history belongs.
 */
export class AdminReportResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) reporterUserId: string;
  @ApiProperty() reporterDisplayName: string;
  @ApiProperty({ format: 'uuid' }) reportedUserId: string;
  @ApiProperty() reportedDisplayName: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  chatRoomId: string | null;
  @ApiProperty() reason: string;
  @ApiProperty({ enum: userReportStatusEnum.enumValues })
  status: UserReportStatus;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  reviewedByAdminId: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  resolvedAt: Date | null;

  constructor(row: AdminReportRow) {
    this.id = row.id;
    this.reporterUserId = row.reporterUserId;
    this.reporterDisplayName = row.reporterDisplayName;
    this.reportedUserId = row.reportedUserId;
    this.reportedDisplayName = row.reportedDisplayName;
    this.chatRoomId = row.chatRoomId;
    this.reason = row.reason;
    this.status = row.status;
    this.reviewedByAdminId = row.reviewedByAdminId;
    this.createdAt = row.createdAt;
    this.resolvedAt = row.resolvedAt;
  }
}
