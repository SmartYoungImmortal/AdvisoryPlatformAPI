import { ApiProperty } from '@nestjs/swagger';
import { invoiceStatusEnum } from '@/database/schema';
import type { PayoutInvoiceRow } from '@/modules/payouts/payouts.types';

/** One invoice a payout settles. Both amounts are integer satang. */
export class PayoutInvoiceResponseDto {
  @ApiProperty({ format: 'uuid' }) invoiceId: string;
  @ApiProperty({ format: 'uuid' }) appointmentId: string;
  @ApiProperty({ description: 'Integer satang' }) amountSatang: number;
  @ApiProperty({ description: 'Integer satang' }) platformFeeSatang: number;
  @ApiProperty({ enum: invoiceStatusEnum.enumValues })
  status: PayoutInvoiceRow['status'];
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  payoutEligibleAt: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(row: PayoutInvoiceRow) {
    this.invoiceId = row.invoiceId;
    this.appointmentId = row.appointmentId;
    this.amountSatang = row.amountSatang;
    this.platformFeeSatang = row.platformFeeSatang;
    this.status = row.status;
    this.payoutEligibleAt = row.payoutEligibleAt;
    this.createdAt = row.createdAt;
  }
}
