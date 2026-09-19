import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { REFUND_REASON_MAX_LENGTH } from '@/modules/refunds/refunds.constants';

export class RejectRefundCaseDto {
  /**
   * Why the refund was refused. Required: a money ruling against an Advisee has to be
   * explainable.
   *
   * `refund_cases` has no column for it. Its `reason` is the requester's own words and is not the
   * Admin's to overwrite, and adding a column is not this module's to do — so the value is
   * validated, recorded in the service log, and deliberately not persisted until a
   * `resolutionNote` column exists. See `RefundsService.reject`.
   */
  @ApiProperty({
    minLength: 1,
    maxLength: REFUND_REASON_MAX_LENGTH,
    description:
      'Required. Not yet persisted: refund_cases has no column for the Admin ruling note.',
  })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(REFUND_REASON_MAX_LENGTH)
  reason!: string;
}
