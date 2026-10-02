import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';

/** The filters `GET /advisors` accepts, alongside page and limit. */
export class PublicAdvisorQueryDto extends OffsetPaginationDto {
  /** Matched against the display name and the headline, case-insensitively. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsUUID()
  skillId?: string;
}
