import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  FLAG_OUTCOMES,
  type OffPlatformFlagOutcome,
} from '../safety.constants';

/**
 * The ruling on an off-platform flag, and the penalty it carries.
 *
 * `penaltyPointsApplied` is only meaningful alongside `CONFIRMED` — a dismissal has nothing
 * to penalise — and the service rejects the combination rather than writing points onto a
 * dismissed flag. The lower bound mirrors the table's own
 * `off_platform_flags_penalty_points_nonnegative` check constraint, so the request fails
 * validation instead of failing in Postgres.
 */
export class ResolveOffPlatformFlagDto {
  @ApiProperty({ enum: FLAG_OUTCOMES })
  @IsIn(FLAG_OUTCOMES)
  outcome!: OffPlatformFlagOutcome;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2_147_483_647)
  penaltyPointsApplied?: number;
}
