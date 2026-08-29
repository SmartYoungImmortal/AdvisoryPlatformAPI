import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InferSelectModel } from 'drizzle-orm';
import { serviceCategories } from '@/database/schema';

export class ServiceCategoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() modifiedAt: Date;

  constructor(category: InferSelectModel<typeof serviceCategories>) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.createdAt = category.createdAt;
    this.modifiedAt = category.modifiedAt;
  }
}
