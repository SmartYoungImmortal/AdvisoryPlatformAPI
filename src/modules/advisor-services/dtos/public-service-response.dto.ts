import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PublicServiceDocument } from '@/modules/advisor-services/advisor-services.types';

/** Public allowlist. Owner-only scheduling configuration is intentionally excluded. */
export class PublicServiceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() advisorId: string;
  @ApiProperty() categoryId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ description: 'Integer satang' }) priceSatang: number;
  @ApiProperty() durationMinutes: number;
  @ApiProperty() screeningRequired: boolean;
  @ApiProperty() trialEnabled: boolean;
  @ApiPropertyOptional({ nullable: true }) trialDurationMinutes: number | null;

  constructor(service: PublicServiceDocument) {
    this.id = service.id;
    this.advisorId = service.advisorId;
    this.categoryId = service.categoryId;
    this.name = service.name;
    this.description = service.description;
    this.priceSatang = service.priceSatang;
    this.durationMinutes = service.durationMinutes;
    this.screeningRequired = service.screeningRequired;
    this.trialEnabled = service.trialEnabled;
    this.trialDurationMinutes = service.trialDurationMinutes;
  }
}
