import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { skillProofReviewStatusEnum } from '@/database/schema';
import type { SkillProofReviewStatus } from '../skill-proofs.constants';

/**
 * The queue filters: what still needs reviewing, and one Advisor's submissions when an
 * admin is working a single case. Accepted statuses are read off the pgEnum itself
 * rather than retyped, so the query string and the column cannot drift apart.
 */
export class SkillProofQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ enum: skillProofReviewStatusEnum.enumValues })
  @IsOptional()
  @IsIn(skillProofReviewStatusEnum.enumValues)
  reviewStatus?: SkillProofReviewStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  advisorId?: string;
}
