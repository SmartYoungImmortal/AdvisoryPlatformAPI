import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { refundCaseStatusEnum } from '@/database/schema';
import type { RefundCaseStatus } from '@/modules/refunds/refunds.types';

export class AdminRefundCaseQueryDto extends OffsetPaginationDto {
  /** Omitted means the whole queue; the values are the `refund_case_status` enum's own. */
  @ApiPropertyOptional({ enum: refundCaseStatusEnum.enumValues })
  @IsOptional()
  @IsIn(refundCaseStatusEnum.enumValues)
  status?: RefundCaseStatus;
}
