import { ApiProperty } from '@nestjs/swagger';
import { trialRequestStatusEnum } from '@/database/schema';
import type {
  TrialRequestRow,
  TrialRequestStatus,
} from '@/modules/trials/trials.types';

/**
 * A free-trial request, as its card in the chat room shows it to either side. `trialDurationMinutes`
 * is the Service's trial length now, null if it no longer offers one. It is also the payload of the
 * chat socket's `chat:trial` event.
 */
export class TrialRequestResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) serviceId: string;
  @ApiProperty() serviceName: string;
  @ApiProperty({ format: 'uuid' }) adviseeId: string;
  @ApiProperty({ format: 'uuid' }) advisorId: string;
  @ApiProperty({ format: 'uuid' }) chatRoomId: string;
  @ApiProperty({ nullable: true, type: Number })
  trialDurationMinutes: number | null;
  /** The booking a granted trial became, unless it was cancelled; null until it is booked. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  trialBookingId: string | null;
  @ApiProperty({ enum: trialRequestStatusEnum.enumValues })
  status: TrialRequestStatus;
  @ApiProperty({ nullable: true, type: String }) decisionReason: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  decidedAt: Date | null;

  constructor(row: TrialRequestRow) {
    this.id = row.id;
    this.serviceId = row.serviceId;
    this.serviceName = row.serviceName;
    this.adviseeId = row.adviseeId;
    this.advisorId = row.advisorId;
    this.chatRoomId = row.chatRoomId;
    this.trialDurationMinutes = row.trialDurationMinutes;
    this.trialBookingId = row.trialBookingId;
    this.status = row.status;
    this.decisionReason = row.decisionReason;
    this.createdAt = row.createdAt;
    this.decidedAt = row.decidedAt;
  }
}
