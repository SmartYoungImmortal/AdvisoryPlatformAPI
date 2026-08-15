import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class CreateSkillDto {
  @ApiProperty({ maxLength: 100 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString()
  description?: string;
}
