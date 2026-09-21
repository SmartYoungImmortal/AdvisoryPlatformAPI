import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { REFUND_REASON_MAX_LENGTH } from '@/modules/refunds/refunds.constants';

export class CreateRefundCaseDto {
  /**
   * The invoice being disputed. Ownership is not inferred from this value: the service resolves
   * the invoice through its appointment's Advisee and refuses anything the caller did not pay for.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  invoiceId!: string;

  /** A refund request always carries written reasoning; evidence files are the optional part. */
  @ApiProperty({ minLength: 1, maxLength: REFUND_REASON_MAX_LENGTH })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(REFUND_REASON_MAX_LENGTH)
  reason!: string;
}
