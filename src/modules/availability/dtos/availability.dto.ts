import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import type { InferSelectModel } from 'drizzle-orm';
import {
  advisorGlobalAvailability,
  availabilityProfiles,
} from '@/database/schema';

type GlobalAvailability = InferSelectModel<typeof advisorGlobalAvailability>;
type AvailabilityProfile = InferSelectModel<typeof availabilityProfiles>;

export class TimeWindowDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @IsNotEmpty()
  endTime!: string;
}

export class WeeklyWindowDto extends TimeWindowDto {
  @ApiProperty({
    minimum: 1,
    maximum: 7,
    description: 'ISO weekday; Monday is 1.',
  })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;
}

export class SpecificWindowDto extends TimeWindowDto {
  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  availableDate!: string;
}

export class BlockedPeriodDto {
  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  blockedDate!: string;

  @ApiPropertyOptional({ example: '12:00', nullable: true })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '13:00', nullable: true })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class UpsertGlobalAvailabilityDto {
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bufferMinutes?: number;

  @ApiPropertyOptional({ minimum: 1, default: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  bookingHorizonDays?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumBookingNoticeMinutes?: number;

  @ApiPropertyOptional({ minimum: 1, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  dailyConsultationLimitMinutes?: number | null;
}

export class UpsertAvailabilityProfileDto {
  @ApiProperty({ maxLength: 150 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ type: () => [WeeklyWindowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyWindowDto)
  weeklyWindows!: WeeklyWindowDto[];

  @ApiPropertyOptional({ type: () => [SpecificWindowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificWindowDto)
  specificWindows?: SpecificWindowDto[];

  @ApiPropertyOptional({ type: () => [BlockedPeriodDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockedPeriodDto)
  blockedPeriods?: BlockedPeriodDto[];
}

export class SlotQueryDto {
  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2026-09-07' })
  @IsDateString()
  to!: string;
}

export class AvailabilitySlotResponseDto {
  @ApiProperty({ format: 'date-time' }) startTime: Date;
  @ApiProperty({ format: 'date-time' }) endTime: Date;

  constructor(startTime: Date, endTime: Date) {
    this.startTime = startTime;
    this.endTime = endTime;
  }
}

export class GlobalAvailabilityResponseDto {
  @ApiProperty() advisorId: string;
  @ApiProperty() slotIntervalMinutes: number;
  @ApiProperty() bufferMinutes: number;
  @ApiProperty() bookingHorizonDays: number;
  @ApiProperty() minimumBookingNoticeMinutes: number;
  @ApiPropertyOptional({ nullable: true }) dailyConsultationLimitMinutes:
    number | null;

  constructor(global: GlobalAvailability) {
    this.advisorId = global.advisorId;
    this.slotIntervalMinutes = global.slotIntervalMinutes;
    this.bufferMinutes = global.bufferMinutes;
    this.bookingHorizonDays = global.bookingHorizonDays;
    this.minimumBookingNoticeMinutes = global.minimumBookingNoticeMinutes;
    this.dailyConsultationLimitMinutes = global.dailyConsultationLimitMinutes;
  }
}

export class AvailabilityProfileResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() advisorId: string;
  @ApiProperty() name: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() modifiedAt: Date;

  constructor(profile: AvailabilityProfile) {
    this.id = profile.id;
    this.advisorId = profile.advisorId;
    this.name = profile.name;
    this.createdAt = profile.createdAt;
    this.modifiedAt = profile.modifiedAt;
  }
}
