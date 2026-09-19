import { ApiProperty } from '@nestjs/swagger';
import { skillProofReviewStatusEnum } from '@/database/schema';
import type { SkillProofReviewStatus } from '../skill-proofs.constants';

/**
 * What the Advisor may read back about their own documents: which skill each one was
 * for, the file they uploaded, and the outcome.
 *
 * `advisorId` is absent because every row is theirs, and `reviewedByAdminId` is left
 * out on purpose: which admin ruled is the audit trail's business, not the submitter's.
 */
export interface OwnSkillProofRow {
  id: string;
  skillId: string;
  skillName: string;
  objectKey: string;
  originalFileName: string;
  reviewStatus: SkillProofReviewStatus;
  rejectionReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export class OwnSkillProofResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
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
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  reviewedAt: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(row: OwnSkillProofRow) {
    this.id = row.id;
    this.skillId = row.skillId;
    this.skillName = row.skillName;
    this.objectKey = row.objectKey;
    this.originalFileName = row.originalFileName;
    this.reviewStatus = row.reviewStatus;
    this.rejectionReason = row.rejectionReason;
    this.reviewedAt = row.reviewedAt;
    this.createdAt = row.createdAt;
  }
}
