import { ApiProperty } from '@nestjs/swagger';
import { identityVerificationStatusEnum } from '@/database/schema';
import type { IdentityVerificationStatus } from '../identity-verification.constants';

/**
 * What the Advisor may read back about their own submission: the status, the scan they
 * uploaded, and the outcome.
 *
 * Two omissions are deliberate. `nationalIdEncrypted` and `nationalIdHash` never
 * appear in any response, including the owner's — the owner already knows the number
 * they typed, and returning it turns every session cookie into a way to read it back.
 * `verifiedByAdminId` is also left out: which admin ruled is the audit trail's
 * business, not the applicant's, and naming a staff member to the person they just
 * rejected serves nothing.
 */
export interface OwnIdentityVerificationRow {
  advisorId: string;
  verificationStatus: IdentityVerificationStatus;
  documentObjectKey: string | null;
  rejectionReason: string | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
}

export class OwnIdentityVerificationResponseDto {
  @ApiProperty({ format: 'uuid' }) advisorId: string;
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

  constructor(row: OwnIdentityVerificationRow) {
    this.advisorId = row.advisorId;
    this.verificationStatus = row.verificationStatus;
    this.documentObjectKey = row.documentObjectKey;
    this.rejectionReason = row.rejectionReason;
    this.submittedAt = row.submittedAt;
    this.verifiedAt = row.verifiedAt;
  }
}
