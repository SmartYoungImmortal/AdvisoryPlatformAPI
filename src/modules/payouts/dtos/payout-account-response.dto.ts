import { ApiProperty } from '@nestjs/swagger';
import {
  PAYOUT_BANKS,
  type PayoutBank,
} from '@/modules/payouts/payouts.constants';
import type { PayoutAccount } from '@/modules/payouts/payouts.types';

/**
 * The Advisor's payout account as they may see it: the bank, the name, and only the last digits
 * of the number. The full number stays with Omise.
 *
 * `verified` and `active` are the Omise recipient's own: a new account is neither until Omise has
 * checked it with the bank, and transfers go only to an active one.
 */
export class PayoutAccountResponseDto {
  @ApiProperty({ enum: PAYOUT_BANKS }) bank: PayoutBank;
  @ApiProperty() accountName: string;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Null when Omise could not be reached',
  })
  lastDigits: string | null;
  @ApiProperty() verified: boolean;
  @ApiProperty() active: boolean;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  createdAt: Date | null;

  constructor(account: PayoutAccount) {
    this.bank = account.bank;
    this.accountName = account.accountName;
    this.lastDigits = account.lastDigits;
    this.verified = account.verified;
    this.active = account.active;
    this.createdAt = account.createdAt;
  }
}
