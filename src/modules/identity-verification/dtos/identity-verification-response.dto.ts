import { ApiProperty } from '@nestjs/swagger';
import { identityVerificationStatusEnum } from '@/database/schema';
import type { IdentityVerificationStatus } from '../identity-verification.constants';

/**
 * One row of the admin verification queue, joined to the Advisor it belongs to.
 *
 * `nationalIdEncrypted` and `nationalIdHash` are absent, and that absence is the
 * point. They are the most sensitive column pair in the schema — the ER states the
 * plaintext is never returned by any endpoint, and the hash is just as identifying
 * because it is a lookup key for a number an attacker can enumerate. No screen in
 * this product needs either one: the queue shows who submitted, the document key and
 * the outcome. The repository never selects them, so this shape cannot leak them by
 * spreading a row, the same allowlist discipline
 * `AdvisorOwnProfileResponseDto` asks for.
 *
 * `documentObjectKey` is a SeaweedFS object key, not a URL. Presigning it is the
 * storage service's job, so naming the key here exposes nothing fetchable.
 */
export interface IdentityVerificationRow {
  advisorId: string;
  displayName: string;
  email: string;
  verificationStatus: IdentityVerificationStatus;
  documentObjectKey: string | null;
  rejectionReason: string | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  verifiedByAdminId: string | null;
}

export class IdentityVerificationResponseDto {
  /** The Advisor's user id is the record's id — `advisor_identity` has no surrogate key. */
  @ApiProperty({ format: 'uuid' }) advisorId: string;
  @ApiProperty() displayName: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: identityVerificationStatusEnum.enumValues })
  verificationStatus: IdentityVerificationStatus;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'SeaweedFS object key of the uploaded scan, not a URL.',
  })
  documentObjectKey: string | null;
  @ApiProperty({ nullable: true, type: String }) rejectionReason: string | null;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  submittedAt: Date | null;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  verifiedAt: Date | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  verifiedByAdminId: string | null;

  constructor(row: IdentityVerificationRow) {
    this.advisorId = row.advisorId;
    this.displayName = row.displayName;
    this.email = row.email;
    this.verificationStatus = row.verificationStatus;
    this.documentObjectKey = row.documentObjectKey;
    this.rejectionReason = row.rejectionReason;
    this.submittedAt = row.submittedAt;
    this.verifiedAt = row.verifiedAt;
    this.verifiedByAdminId = row.verifiedByAdminId;
  }
}
