import { ApiProperty } from '@nestjs/swagger';
import { screeningStatusEnum } from '@/database/schema';
import type {
  ScreeningRequest,
  ScreeningStatus,
} from '@/modules/screening/screening.types';

/**
 * The Advisee's own view of a request. `viewedAt` is withheld: whether the Advisor has opened it
 * yet is the Advisor's inbox state, not the Advisee's business.
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
