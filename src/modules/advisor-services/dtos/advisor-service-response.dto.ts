import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import { services } from '@/database/schema';

type AdvisorService = InferSelectModel<typeof services>;

export class AdvisorServiceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() advisorId: string;
  @ApiProperty() categoryId: string;
  /** The categories it is also found under, beside `categoryId`. */
  @ApiProperty({ type: [String], format: 'uuid' }) extraCategoryIds: string[];
  @ApiPropertyOptional({ nullable: true }) availabilityProfileId: string | null;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty({ description: 'Integer satang' }) priceSatang: number;
  @ApiProperty() durationMinutes: number;
  @ApiPropertyOptional({ nullable: true }) dailyConsultationLimitMinutes:
    number | null;
  @ApiProperty() isPublished: boolean;
  @ApiProperty() screeningRequired: boolean;
  @ApiProperty() trialEnabled: boolean;
  @ApiPropertyOptional() trialDurationMinutes: number | null;
  /** The advisor's other services this one's page shows, in order; empty lets the page choose. */
  @ApiProperty({ type: [String], format: 'uuid' }) relatedServiceIds: string[];
  /** The first photograph as a URL a browser can fetch, on the owner's routes; null without one. */
  @ApiPropertyOptional({ nullable: true, type: String, format: 'uri' })
  coverImage: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() modifiedAt: Date;

  constructor(service: AdvisorService, coverImage: string | null = null) {
    this.coverImage = coverImage;
    this.id = service.id;
    this.advisorId = service.advisorId;
    this.categoryId = service.categoryId;
    this.extraCategoryIds = service.extraCategoryIds;
    this.availabilityProfileId = service.availabilityProfileId;
    this.name = service.name;
    this.description = service.description;
    this.priceSatang = service.priceSatang;
    this.durationMinutes = service.durationMinutes;
    this.dailyConsultationLimitMinutes = service.dailyConsultationLimitMinutes;
    this.isPublished = service.isPublished;
    this.screeningRequired = service.screeningRequired;
    this.trialEnabled = service.trialEnabled;
    this.trialDurationMinutes = service.trialDurationMinutes;
    this.relatedServiceIds = service.relatedServiceIds;
    this.createdAt = service.createdAt;
    this.modifiedAt = service.modifiedAt;
  }
}
