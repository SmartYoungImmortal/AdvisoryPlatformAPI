import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startTime!: string;

  /** The service's package to book, when it is sold in packages: its length sets the end time. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  packageId?: string;

  /**
   * Book the Advisee's granted free trial: the service's trial length, no package and no
   * payment, so the booking is confirmed at once.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  trial?: boolean;
}
