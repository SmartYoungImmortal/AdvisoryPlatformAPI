import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class RescheduleBookingDto {
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startTime!: string;
}
