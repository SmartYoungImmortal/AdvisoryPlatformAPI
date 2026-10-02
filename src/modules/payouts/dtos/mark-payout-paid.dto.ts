import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

export class MarkPayoutPaidDto {
  /**
   * The provider's transfer id, when the operator has it. Optional because a payout may be
   * reconciled before the provider reference comes back; an omitted value leaves whatever is
   * already on the row rather than clearing it.
   */
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  providerTransferId?: string;
}
