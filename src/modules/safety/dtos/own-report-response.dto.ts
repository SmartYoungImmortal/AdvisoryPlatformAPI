import { ApiProperty } from '@nestjs/swagger';
import { userReportStatusEnum } from '@/database/schema';
import type { UserReportStatus } from '../safety.constants';
import type { OwnReportRow } from '../safety.types';

/**
 * A report as the person who filed it sees it.
 *
 * Narrower than the admin DTO by one field on purpose: `reviewedByAdminId` names the admin
 * who ruled, which is the console's business and not the reporter's. The reported account is
 * named by `displayName` only — the reporter already knows who they reported, and nothing
 * about that account's own record is theirs to read.
 */
export class OwnReportResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) reportedUserId: string;
  @ApiProperty() reportedDisplayName: string;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  chatRoomId: string | null;
  @ApiProperty() reason: string;
  @ApiProperty({ enum: userReportStatusEnum.enumValues })
  status: UserReportStatus;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  resolvedAt: Date | null;

  constructor(row: OwnReportRow) {
    this.id = row.id;
    this.reportedUserId = row.reportedUserId;
    this.reportedDisplayName = row.reportedDisplayName;
    this.chatRoomId = row.chatRoomId;
    this.reason = row.reason;
    this.status = row.status;
    this.createdAt = row.createdAt;
    this.resolvedAt = row.resolvedAt;
  }
}
