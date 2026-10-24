import { ApiProperty } from '@nestjs/swagger';
import { screeningStatusEnum } from '@/database/schema';
import type {
  ScreeningRequest,
  ScreeningStatus,
} from '@/modules/screening/screening.types';

/**
 * A request as the Advisee sees it. `viewedAt` is left out because it is only used in the Advisor's
 * list.
 */
export class ScreeningRequestResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) serviceId: string;
  @ApiProperty({ enum: screeningStatusEnum.enumValues })
  status: ScreeningStatus;
  @ApiProperty({ nullable: true, type: String }) decisionReason: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  decidedAt: Date | null;

  constructor(request: ScreeningRequest) {
    this.id = request.id;
    this.serviceId = request.serviceId;
    this.status = request.status;
    this.decisionReason = request.decisionReason;
    this.createdAt = request.createdAt;
    this.decidedAt = request.decidedAt;
  }
}
