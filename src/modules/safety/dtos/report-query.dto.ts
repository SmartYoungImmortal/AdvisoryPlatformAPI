import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { userReportStatusEnum } from '@/database/schema';
import type { UserReportStatus } from '../safety.constants';

/** The filters `GET /admin/reports` accepts, alongside page and limit. */
export class ReportQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ enum: userReportStatusEnum.enumValues })
  @IsOptional()
  @IsIn(userReportStatusEnum.enumValues)
  status?: UserReportStatus;
}
