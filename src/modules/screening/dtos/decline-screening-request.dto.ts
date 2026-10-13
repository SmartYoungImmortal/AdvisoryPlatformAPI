import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { SCREENING_DECLINE_MESSAGE_MAX_LENGTH } from '@/modules/screening/screening.constants';

export class DeclineScreeningRequestDto {
  /**
   * Optional message to the Advisee. It is shown on their declined screen only if the Advisor
   * writes one.
   */
  @ApiPropertyOptional({ maxLength: SCREENING_DECLINE_MESSAGE_MAX_LENGTH })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(SCREENING_DECLINE_MESSAGE_MAX_LENGTH)
  message?: string;
}
