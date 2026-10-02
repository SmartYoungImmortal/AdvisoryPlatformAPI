import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  appointmentStateEnum,
  appointmentTypeEnum,
  invoiceStatusEnum,
} from '@/database/schema';
import type { CaseAppointmentRow, CaseMessageRow } from '../safety.types';

export class CaseMessageDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) senderUserId: string;
  @ApiProperty() senderDisplayName: string;
  @ApiProperty() senderFullName: string;
  @ApiProperty() message: string;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(row: CaseMessageRow) {
    this.id = row.id;
    this.senderUserId = row.senderUserId;
    this.senderDisplayName = row.senderDisplayName;
    this.senderFullName = row.senderFullName;
    this.message = row.message;
    this.createdAt = row.createdAt;
  }
}

export class CaseAppointmentDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) serviceId: string;
  @ApiProperty() serviceName: string;
  @ApiProperty({ format: 'uuid' }) advisorId: string;
  @ApiProperty({ format: 'uuid' }) adviseeId: string;
  @ApiProperty({ enum: appointmentTypeEnum.enumValues }) type: string;
  @ApiProperty({ enum: appointmentStateEnum.enumValues }) state: string;
  @ApiProperty({ format: 'date-time' }) startTime: Date;
  @ApiProperty({ format: 'date-time' }) endTime: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  cancelledAt: Date | null;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  cancelledByUserId: string | null;
  /** The video room the session ran in — there is no recording, only the room. */
  @ApiProperty({ nullable: true, type: String }) jitsiRoomName: string | null;
  @ApiProperty({ nullable: true, type: Number }) invoiceAmountSatang:
    number | null;
  @ApiProperty({
    enum: invoiceStatusEnum.enumValues,
    nullable: true,
    type: String,
  })
  invoiceStatus: string | null;

  constructor(row: CaseAppointmentRow) {
    this.id = row.id;
    this.serviceId = row.serviceId;
    this.serviceName = row.serviceName;
    this.advisorId = row.advisorId;
    this.adviseeId = row.adviseeId;
    this.type = row.type;
    this.state = row.state;
    this.startTime = row.startTime;
    this.endTime = row.endTime;
    this.cancelledAt = row.cancelledAt;
    this.cancelledByUserId = row.cancelledByUserId;
    this.jitsiRoomName = row.jitsiRoomName;
    this.invoiceAmountSatang = row.invoiceAmountSatang;
    this.invoiceStatus = row.invoiceStatus;
  }
}

/**
 * The evidence beside a report or a flag: the conversation it came from and the
 * consultation that conversation belongs to. Both are empty when the case names no
 * room — a report filed from a profile, say.
 */
export class CaseContextResponseDto {
  /** For a flag, the line the detector matched; absent for a report. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  flaggedMessageId: string | null;
  @ApiProperty({ type: [CaseMessageDto] }) conversation: CaseMessageDto[];
  @ApiProperty({ type: CaseAppointmentDto, nullable: true })
  appointment: CaseAppointmentDto | null;

  constructor(
    conversation: CaseMessageRow[],
    appointment: CaseAppointmentRow | undefined,
    flaggedMessageId: string | null = null,
  ) {
    this.flaggedMessageId = flaggedMessageId;
    this.conversation = conversation.map((row) => new CaseMessageDto(row));
    this.appointment = appointment ? new CaseAppointmentDto(appointment) : null;
  }
}
