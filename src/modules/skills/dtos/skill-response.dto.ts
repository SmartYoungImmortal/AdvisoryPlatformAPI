import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InferSelectModel } from 'drizzle-orm';
import { skills } from '@/database/schema';

export class SkillResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  /** The admin who created the row; null for rows that predate the column. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  createdByUserId: string | null;
  /** The admin who last changed the row; null for rows that predate the column. */
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  updatedByUserId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() modifiedAt: Date;

  constructor(skill: InferSelectModel<typeof skills>) {
    this.id = skill.id;
    this.name = skill.name;
    this.description = skill.description;
    this.createdByUserId = skill.createdByUserId;
    this.updatedByUserId = skill.updatedByUserId;
    this.createdAt = skill.createdAt;
    this.modifiedAt = skill.modifiedAt;
  }
}
