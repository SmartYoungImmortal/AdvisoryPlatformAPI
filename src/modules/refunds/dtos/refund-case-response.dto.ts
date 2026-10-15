import { ApiProperty } from '@nestjs/swagger';
import { refundCaseStatusEnum } from '@/database/schema';
import type { RefundCase } from '@/modules/refunds/refunds.types';

/**
 * The requester's own view of a case.
 *
 * `reviewedByAdminId` is deliberately absent: the Advisee is told the outcome, not which Admin
 * made it. Naming the individual moderator to the person they ruled against is the one field this
 * allowlist exists to withhold.
 */
export class RefundCaseResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) invoiceId: string;
  @ApiProperty() reason: string;
  @ApiProperty({ enum: refundCaseStatusEnum.enumValues })
  status: RefundCase['status'];
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  resolvedAt: Date | null;

  constructor(refundCase: RefundCase) {
    this.id = refundCase.id;
    this.invoiceId = refundCase.invoiceId;
    this.reason = refundCase.reason;
    this.status = refundCase.status;
    this.createdAt = refundCase.createdAt;
    this.resolvedAt = refundCase.resolvedAt;
  }
}
