import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { TRIAL_DECLINE_MESSAGE_MAX_LENGTH } from '@/modules/trials/trials.constants';

export class DeclineTrialRequestDto {
  /** Optional message to the Advisee, shown on the request's card if the Advisor writes one. */
  @ApiPropertyOptional({ maxLength: TRIAL_DECLINE_MESSAGE_MAX_LENGTH })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(TRIAL_DECLINE_MESSAGE_MAX_LENGTH)
  message?: string;
}
