import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateAdvisorProfileDto {
  @ApiProperty()
  @IsString()
  headline!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;
}
