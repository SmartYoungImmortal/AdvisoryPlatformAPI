import { ApiProperty } from '@nestjs/swagger';
import { skillProofReviewStatusEnum } from '@/database/schema';
import type { SkillProofReviewStatus } from '../skill-proofs.constants';

/**
 * One row of the admin skill-proof queue: the document, the skill it is offered for,
 * and who submitted it.
 *
 * A deliberate allowlist. The Advisor is named by `advisorDisplayName` — their public
 * display identity, which is what the queue row renders — and nothing else about them
 * is joined in. `email` deliberately stays out: unlike identity verification, where an
 * admin may need to contact the applicant about a national-ID document, reviewing a
 * certificate needs no address, and a field nobody reads is a field that leaks for
 * nothing.
 *
 * `objectKey` is a SeaweedFS object key, not a URL. Presigning it is the storage
 * service's job, so naming the key here exposes nothing fetchable.
 */
export interface SkillProofRow {
  id: string;
  advisorId: string;
  advisorDisplayName: string;
  skillId: string;
  skillName: string;
  objectKey: string;
  originalFileName: string;
  reviewStatus: SkillProofReviewStatus;
  rejectionReason: string | null;
  reviewedByAdminId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export class SkillProofResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) advisorId: string;
  @ApiProperty() advisorDisplayName: string;
  @ApiProperty({ format: 'uuid' }) skillId: string;
  @ApiProperty() skillName: string;
  @ApiProperty({
    description: 'SeaweedFS object key of the uploaded document, not a URL.',
  })
  objectKey: string;
  @ApiProperty() originalFileName: string;
  @ApiProperty({ enum: skillProofReviewStatusEnum.enumValues })
  reviewStatus: SkillProofReviewStatus;
  @ApiProperty({ nullable: true, type: String }) rejectionReason: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  reviewedByAdminId: string | null;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  reviewedAt: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(row: SkillProofRow) {
    this.id = row.id;
    this.advisorId = row.advisorId;
    this.advisorDisplayName = row.advisorDisplayName;
    this.skillId = row.skillId;
    this.skillName = row.skillName;
    this.objectKey = row.objectKey;
    this.originalFileName = row.originalFileName;
    this.reviewStatus = row.reviewStatus;
    this.rejectionReason = row.rejectionReason;
    this.reviewedByAdminId = row.reviewedByAdminId;
    this.reviewedAt = row.reviewedAt;
    this.createdAt = row.createdAt;
  }
}
