import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { payoutStatusEnum } from '@/database/schema';
import type { PayoutStatus } from '@/modules/payouts/payouts.types';

export class AdminPayoutQueryDto extends OffsetPaginationDto {
  /** Omitted means every payout; the values are the `payout_status` enum's own. */
  @ApiPropertyOptional({ enum: payoutStatusEnum.enumValues })
  @IsOptional()
  @IsIn(payoutStatusEnum.enumValues)
  status?: PayoutStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  advisorId?: string;
}
