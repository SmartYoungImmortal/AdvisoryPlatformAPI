import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import {
  ADVISOR_LEVELS,
  type AdvisorLevel,
} from '@/modules/advisors/advisors.constants';

/**
 * Approving an identity may set the Advisor's level at the same time. Left out, the level
 * stays what it is (1 for a new Advisor), so an approval without one still works.
 */
export class ApproveIdentityVerificationDto {
  @ApiPropertyOptional({ enum: ADVISOR_LEVELS })
  @IsOptional()
  @IsIn(ADVISOR_LEVELS)
  level?: AdvisorLevel;
}

/** Changing a verified Advisor's level later. */
export class SetAdvisorLevelDto {
  @ApiProperty({ enum: ADVISOR_LEVELS })
  @IsIn(ADVISOR_LEVELS)
  level!: AdvisorLevel;
}
