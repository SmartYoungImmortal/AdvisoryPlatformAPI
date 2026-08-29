import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

export class CreateAdvisorServiceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  availabilityProfileId!: string;

  @ApiProperty({ maxLength: 150 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ minimum: 0, description: 'Integer satang' })
  @IsInt()
  @Min(0)
  priceSatang!: number;

  @ApiProperty({ minimum: 1, description: 'Positive number of minutes' })
  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  screeningRequired?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  trialEnabled?: boolean;

  @ApiPropertyOptional({ minimum: 1 })
  @ValidateIf((dto: CreateAdvisorServiceDto) => dto.trialEnabled === true)
  @IsInt()
  @Min(1)
  trialDurationMinutes?: number;
}
