import { ApiProperty } from '@nestjs/swagger';
import type { UpcomingSessionRow } from '@/modules/notifications/notifications.types';

/** The session the mobile banner announces, from the reader's side. */
export class UpcomingSessionResponseDto {
  @ApiProperty({ format: 'uuid' }) bookingId: string;
  @ApiProperty() serviceName: string;
  @ApiProperty({ description: 'The other person in the session.' })
  counterpartName: string;
  @ApiProperty({ enum: ['advisee', 'advisor'] }) role: 'advisee' | 'advisor';
  @ApiProperty({ enum: ['BOOKED', 'IN_PROGRESS'] }) state: string;
  @ApiProperty({ format: 'date-time' }) startTime: Date;
  @ApiProperty({ format: 'date-time' }) endTime: Date;

  constructor(row: UpcomingSessionRow, userId: string) {
    const isAdvisor = row.advisorId === userId;
    this.bookingId = row.bookingId;
    this.serviceName = row.serviceName;
    this.counterpartName = isAdvisor ? row.adviseeName : row.advisorName;
    this.role = isAdvisor ? 'advisor' : 'advisee';
    this.state = row.state;
    this.startTime = row.startTime;
    this.endTime = row.endTime;
  }
}
