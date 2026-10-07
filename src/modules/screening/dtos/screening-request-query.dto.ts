import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { screeningStatusEnum } from '@/database/schema';
import type { ScreeningStatus } from '@/modules/screening/screening.types';

export class ScreeningRequestQueryDto extends OffsetPaginationDto {
  /** Omitted means every request; the values are the `screening_status` enum's own. */
  @ApiPropertyOptional({ enum: screeningStatusEnum.enumValues })
  @IsOptional()
  @IsIn(screeningStatusEnum.enumValues)
  status?: ScreeningStatus;
}
