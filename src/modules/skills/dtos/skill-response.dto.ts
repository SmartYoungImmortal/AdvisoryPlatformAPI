import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InferSelectModel } from 'drizzle-orm';
import { skills } from '../../../database/schema';

export class SkillResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() modifiedAt: Date;

  constructor(skill: InferSelectModel<typeof skills>) {
    this.id = skill.id;
    this.name = skill.name;
    this.description = skill.description;
    this.createdAt = skill.createdAt;
    this.modifiedAt = skill.modifiedAt;
  }
}
