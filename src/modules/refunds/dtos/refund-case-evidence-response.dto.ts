import { ApiProperty } from '@nestjs/swagger';
import type { RefundCaseEvidenceRow } from '@/modules/refunds/refunds.types';

/** One uploaded evidence file, named by its object key — never by a URL. */
export class RefundCaseEvidenceResponseDto {
  @ApiProperty() objectKey: string;
  @ApiProperty() originalFileName: string;
  @ApiProperty() mimeType: string;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(row: RefundCaseEvidenceRow) {
    this.objectKey = row.objectKey;
    this.originalFileName = row.originalFileName;
    this.mimeType = row.mimeType;
    this.createdAt = row.createdAt;
  }
}
