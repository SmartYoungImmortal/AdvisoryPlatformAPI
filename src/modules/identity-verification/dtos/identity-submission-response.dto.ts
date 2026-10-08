import { ApiProperty } from '@nestjs/swagger';
import { identityVerificationStatusEnum } from '@/database/schema';
import type { IdentityVerificationStatus } from '../identity-verification.constants';

/**
 * What a submission echoes: the status and when — never the document's key or a URL
 * to it (docs/api-spec.md). The owner reads their record back through
 * `GET /advisors/me/identity-verification` when a screen needs more.
 */
export class IdentitySubmissionResponseDto {
  @ApiProperty({ enum: identityVerificationStatusEnum.enumValues })
  verificationStatus: IdentityVerificationStatus;
  @ApiProperty({ format: 'date-time' }) submittedAt: Date;

  constructor(row: {
    verificationStatus: IdentityVerificationStatus;
    submittedAt: Date;
  }) {
    this.verificationStatus = row.verificationStatus;
    this.submittedAt = row.submittedAt;
  }
}
