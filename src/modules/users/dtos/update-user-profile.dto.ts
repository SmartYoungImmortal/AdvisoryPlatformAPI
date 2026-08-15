import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Asia/Bangkok' })
  @Trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;
}
