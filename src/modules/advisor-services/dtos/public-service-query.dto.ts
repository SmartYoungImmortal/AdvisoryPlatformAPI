import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';

export class PublicServiceQueryDto extends OffsetPaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  advisorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  minPriceSatang?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  maxPriceSatang?: number;

  /**
   * Only services with at least one bookable slot on this calendar date
   * (`YYYY-MM-DD`), read in each advisor's own time zone. The caller sends its
   * own "today", so the date is the reader's rather than the server's.
   */
  @ApiPropertyOptional({ example: '2026-10-24' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  availableOn?: string;
}
