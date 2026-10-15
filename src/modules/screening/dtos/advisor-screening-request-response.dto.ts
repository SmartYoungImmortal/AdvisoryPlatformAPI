import { ApiProperty } from '@nestjs/swagger';
import { screeningStatusEnum } from '@/database/schema';
import type {
  AdvisorScreeningRequestRow,
  ScreeningStatus,
} from '@/modules/screening/screening.types';

/**
 * One row in the Advisor's request list (Figma "Advisor - Screening requests"). `viewedAt` is null
 * until the Advisor opens the request; the list shows an unread dot for those.
 */
export class AdvisorScreeningRequestResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) serviceId: string;
  @ApiProperty() serviceName: string;
  @ApiProperty({ format: 'uuid' }) adviseeId: string;
  @ApiProperty() adviseeDisplayName: string;
  @ApiProperty({ enum: screeningStatusEnum.enumValues })
  status: ScreeningStatus;
  @ApiProperty({ nullable: true, type: String }) decisionReason: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  decidedAt: Date | null;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  viewedAt: Date | null;

  constructor(row: AdvisorScreeningRequestRow) {
    this.id = row.id;
    this.serviceId = row.serviceId;
    this.serviceName = row.serviceName;
    this.adviseeId = row.adviseeId;
    this.adviseeDisplayName = row.adviseeDisplayName;
    this.status = row.status;
    this.decisionReason = row.decisionReason;
    this.createdAt = row.createdAt;
    this.decidedAt = row.decidedAt;
    this.viewedAt = row.viewedAt;
  }
}
