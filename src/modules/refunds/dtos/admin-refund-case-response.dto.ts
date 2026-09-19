import { ApiProperty } from '@nestjs/swagger';
import { refundCaseStatusEnum } from '@/database/schema';
import type {
  AdminRefundCaseRow,
  RefundCaseStatus,
} from '@/modules/refunds/refunds.types';

/**
 * One row of the Admin queue. The requester is named by `displayName` — their public display
 * identity — and deliberately nothing else; `fullName` and `email` stay out of every refund
 * response, including this one.
 */
export class AdminRefundCaseResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) invoiceId: string;
  @ApiProperty({ format: 'uuid' }) requestedByUserId: string;
  @ApiProperty() requesterDisplayName: string;
  @ApiProperty({ description: 'Integer satang' }) invoiceAmountSatang: number;
  @ApiProperty() reason: string;
  @ApiProperty({ enum: refundCaseStatusEnum.enumValues })
  status: RefundCaseStatus;
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  reviewedByAdminId: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  resolvedAt: Date | null;

  constructor(row: AdminRefundCaseRow) {
    this.id = row.id;
    this.invoiceId = row.invoiceId;
    this.requestedByUserId = row.requestedByUserId;
    this.requesterDisplayName = row.requesterDisplayName;
    this.invoiceAmountSatang = row.invoiceAmountSatang;
    this.reason = row.reason;
    this.status = row.status;
    this.reviewedByAdminId = row.reviewedByAdminId;
    this.createdAt = row.createdAt;
    this.resolvedAt = row.resolvedAt;
  }
}
