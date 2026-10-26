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
  /** When the service was listed, so discovery can sort newest first. */
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  /**
   * The service's photographs from `service_images`, in carousel order. A key
   * stored as an absolute URL is returned as it is; a storage key is presigned,
   * on the detail route only, so a page of results never waits on storage.
   */
  @ApiProperty({
    type: [String],
    format: 'uri',
    description:
      'Absolute photograph URLs in carousel order. The list carries only URLs that need no signing; the detail route adds presigned storage objects.',
  })
  images: string[];

  constructor(service: PublicServiceDocument, images: readonly string[]) {
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
    this.createdAt = service.createdAt;
    this.images = [...images];
  }
}
