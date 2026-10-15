import { ApiProperty } from '@nestjs/swagger';
import { payoutStatusEnum } from '@/database/schema';
import type { Payout, PayoutStatus } from '@/modules/payouts/payouts.types';

/**
 * The Advisor's own view of a payout.
 *
 * Every amount is integer satang. `netAmountSatang` is a plain integer subtraction of the transfer
 * fee from the gross — the API never divides money into baht, the client formats it.
 */
export class PayoutResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
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

  constructor(payout: Payout) {
    this.id = payout.id;
    this.amountSatang = payout.amountSatang;
    this.transferFeeSatang = payout.transferFeeSatang;
    this.netAmountSatang = payout.amountSatang - payout.transferFeeSatang;
    this.providerTransferId = payout.providerTransferId;
    this.status = payout.status;
    this.createdAt = payout.createdAt;
    this.paidAt = payout.paidAt;
  }
}
