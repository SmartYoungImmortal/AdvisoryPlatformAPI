import { ApiProperty } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import { serviceAppointments } from '@/database/schema';

type Appointment = InferSelectModel<typeof serviceAppointments>;

export class BookingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() serviceId: string;
  @ApiProperty() advisorId: string;
  @ApiProperty() adviseeId: string;
  @ApiProperty({ format: 'date-time' }) startTime: Date;
  @ApiProperty({ format: 'date-time' }) endTime: Date;
  @ApiProperty({ format: 'date-time' }) unavailableUntil: Date;
  @ApiProperty({
    enum: [
      'PENDING_PAYMENT',
      'BOOKED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ],
  })
  state: Appointment['state'];
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
    this.createdAt = appointment.createdAt;
  }
}
