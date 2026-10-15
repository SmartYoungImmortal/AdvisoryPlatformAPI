import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import { userStatusEnum } from '@/database/schema';
import {
  ACCOUNT_ROLES,
  type AccountRole,
  type UserStatus,
} from '../admin-accounts.constants';

/** The filters `GET /admin/accounts` accepts, alongside page and limit. */
export class AccountQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ enum: userStatusEnum.enumValues })
  @IsOptional()
  @IsIn(userStatusEnum.enumValues)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: ACCOUNT_ROLES })
  @IsOptional()
  @IsIn(ACCOUNT_ROLES)
  role?: AccountRole;

  /** Matched against the display name and the email address, case-insensitively. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
