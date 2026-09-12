import { ApiProperty } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import { appointmentStateEnum, serviceAppointments } from '@/database/schema';

type Appointment = InferSelectModel<typeof serviceAppointments>;

export class BookingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() serviceId: string;
  @ApiProperty() advisorId: string;
  @ApiProperty() adviseeId: string;
  @ApiProperty({ format: 'date-time' }) startTime: Date;
  @ApiProperty({ format: 'date-time' }) endTime: Date;
  @ApiProperty({ format: 'date-time' }) unavailableUntil: Date;
  @ApiProperty({ enum: appointmentStateEnum.enumValues })
  state: Appointment['state'];
  /** False once a cancellation reopened the range for other Advisees. */
  @ApiProperty() blocksAvailability: boolean;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  cancelledAt: Date | null;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  cancelledByUserId: string | null;
  @ApiProperty() createdAt: Date;

  constructor(appointment: Appointment) {
    this.id = appointment.id;
    this.serviceId = appointment.serviceId;
    this.advisorId = appointment.advisorId;
    this.adviseeId = appointment.adviseeId;
    this.startTime = appointment.startTime;
    this.endTime = appointment.endTime;
    this.unavailableUntil = appointment.unavailableUntil;
    this.state = appointment.state;
    this.blocksAvailability = appointment.blocksAvailability;
    this.cancelledAt = appointment.cancelledAt;
    this.cancelledByUserId = appointment.cancelledByUserId;
    this.createdAt = appointment.createdAt;
  }
}
