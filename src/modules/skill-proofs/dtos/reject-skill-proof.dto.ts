import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { SKILL_PROOF_REJECTION_REASON_MAX_LENGTH } from '../skill-proofs.constants';

export class RejectSkillProofDto {
  /**
   * Required, and not blankable. A rejection the Advisor cannot read a reason for is a
   * dead end they can only answer by uploading the same document again, so an empty
   * string is rejected rather than stored.
   */
  @ApiProperty({
    minLength: 1,
    maxLength: SKILL_PROOF_REJECTION_REASON_MAX_LENGTH,
  })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(SKILL_PROOF_REJECTION_REASON_MAX_LENGTH)
  reason!: string;
}
