import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { identityVerificationStatusEnum } from '@/database/schema';
import type { IdentityVerificationStatus } from '../identity-verification.constants';

/**
 * The queue filter. The accepted values are read off the pgEnum itself rather than
 * retyped, so the query string and the column cannot drift apart.
 */
export class IdentityVerificationQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ enum: identityVerificationStatusEnum.enumValues })
  @IsOptional()
  @IsIn(identityVerificationStatusEnum.enumValues)
  status?: IdentityVerificationStatus;
}
