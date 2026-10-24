import { ApiProperty } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import type { pdpaConsents } from '@/database/schema';

export type PdpaConsent = InferSelectModel<typeof pdpaConsents>;

/**
 * `consentedAt` is the moment the version was first agreed to. It never moves, because a
 * consent record is evidence of when consent was given, not of when it was last mentioned.
 */
export class PdpaConsentResponseDto {
  @ApiProperty({ format: 'uuid' }) userId: string;
  @ApiProperty() policyVersion: string;
  @ApiProperty({ format: 'date-time' }) consentedAt: Date;

  constructor(consent: PdpaConsent) {
    this.userId = consent.userId;
    this.policyVersion = consent.policyVersion;
    this.consentedAt = consent.consentedAt;
  }
}
