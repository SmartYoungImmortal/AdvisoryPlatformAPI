import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InferSelectModel } from 'drizzle-orm';
import { serviceCategories } from '@/database/schema';

export class ServiceCategoryResponseDto {
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

  constructor(category: InferSelectModel<typeof serviceCategories>) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.createdByUserId = category.createdByUserId;
    this.updatedByUserId = category.updatedByUserId;
    this.createdAt = category.createdAt;
    this.modifiedAt = category.modifiedAt;
  }
}
