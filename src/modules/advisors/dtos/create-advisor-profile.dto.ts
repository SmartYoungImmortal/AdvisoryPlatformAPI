import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class CreateAdvisorProfileDto {
  @ApiProperty()
  @Trim()
  @IsString()
  @IsNotEmpty()
  headline!: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString()
  bio?: string;
}
