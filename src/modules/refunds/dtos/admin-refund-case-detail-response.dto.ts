import { ApiProperty } from '@nestjs/swagger';
import type {
  AdminRefundCaseRow,
  RefundCaseEvidenceRow,
} from '@/modules/refunds/refunds.types';
import { AdminRefundCaseResponseDto } from './admin-refund-case-response.dto';
import { RefundCaseEvidenceResponseDto } from './refund-case-evidence-response.dto';

/** The queue row plus the files the requester attached — what the review screen needs to rule. */
export class AdminRefundCaseDetailResponseDto extends AdminRefundCaseResponseDto {
  @ApiProperty({ type: () => [RefundCaseEvidenceResponseDto] })
  evidence: RefundCaseEvidenceResponseDto[];

  constructor(
    row: AdminRefundCaseRow,
    evidence: readonly RefundCaseEvidenceRow[],
  ) {
    super(row);
    this.evidence = evidence.map(
      (file) => new RefundCaseEvidenceResponseDto(file),
    );
  }
}
