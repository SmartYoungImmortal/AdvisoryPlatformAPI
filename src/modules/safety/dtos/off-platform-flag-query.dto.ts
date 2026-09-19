import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { offPlatformFlagStatusEnum } from '@/database/schema';
import type { OffPlatformFlagStatus } from '../safety.constants';

/** The filters `GET /admin/off-platform-flags` accepts, alongside page and limit. */
export class OffPlatformFlagQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ enum: offPlatformFlagStatusEnum.enumValues })
  @IsOptional()
  @IsIn(offPlatformFlagStatusEnum.enumValues)
  status?: OffPlatformFlagStatus;
}
