import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { REJECTION_REASON_MAX_LENGTH } from '../identity-verification.constants';

export class RejectIdentityVerificationDto {
  /**
   * Required, and not blankable. A rejection the Advisor cannot read a reason for is a
   * dead end they can only answer by resubmitting the same document, so an empty
   * string is rejected rather than stored.
   */
  @ApiProperty({ minLength: 1, maxLength: REJECTION_REASON_MAX_LENGTH })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(REJECTION_REASON_MAX_LENGTH)
  reason!: string;
}
