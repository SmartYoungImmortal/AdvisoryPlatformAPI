import { ApiProperty } from '@nestjs/swagger';
import { payoutStatusEnum } from '@/database/schema';
import type {
  AdminPayoutRow,
  PayoutStatus,
} from '@/modules/payouts/payouts.types';

/**
 * One row of the Admin payout queue. The Advisor is named by `displayName` — their public display
 * identity — and by nothing else; `fullName` and `email` stay out of this response, and so does
 * anything about their bank account.
 *
 * `netAmountSatang` is an integer subtraction. Nothing here converts satang to baht.
 */
export class AdminPayoutResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) advisorId: string;
  @ApiProperty() advisorDisplayName: string;
  @ApiProperty({ description: 'Integer satang' }) amountSatang: number;
  @ApiProperty({ description: 'Integer satang' }) transferFeeSatang: number;
  @ApiProperty({
    description: 'Integer satang: amountSatang - transferFeeSatang',
  })
  netAmountSatang: number;
  @ApiProperty({ nullable: true, type: String })
  providerTransferId: string | null;
  @ApiProperty({ enum: payoutStatusEnum.enumValues }) status: PayoutStatus;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  paidAt: Date | null;

  constructor(row: AdminPayoutRow) {
    this.id = row.id;
    this.advisorId = row.advisorId;
    this.advisorDisplayName = row.advisorDisplayName;
    this.amountSatang = row.amountSatang;
    this.transferFeeSatang = row.transferFeeSatang;
    this.netAmountSatang = row.amountSatang - row.transferFeeSatang;
    this.providerTransferId = row.providerTransferId;
    this.status = row.status;
    this.createdAt = row.createdAt;
    this.paidAt = row.paidAt;
  }
}
