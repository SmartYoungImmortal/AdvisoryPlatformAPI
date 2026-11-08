import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import {
  PAYOUT_ACCOUNT_NAME_MAX_LENGTH,
  PAYOUT_ACCOUNT_NUMBER_PATTERN,
  PAYOUT_BANKS,
  type PayoutBank,
} from '@/modules/payouts/payouts.constants';

/** The account an Advisor is paid into. Saving one replaces the one before it. */
export class SavePayoutAccountDto {
  @ApiProperty({ enum: PAYOUT_BANKS })
  @IsIn(PAYOUT_BANKS)
  bank!: PayoutBank;

  /** As the passbook prints it; spaces and dashes are taken out before it is checked. */
  @ApiProperty({ example: '123-4-56789-0' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '') : value,
  )
  @IsString()
  @Matches(PAYOUT_ACCOUNT_NUMBER_PATTERN)
  accountNumber!: string;

  /** The name on the account, which the bank checks the transfer against. */
  @ApiProperty({ maxLength: PAYOUT_ACCOUNT_NAME_MAX_LENGTH })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(PAYOUT_ACCOUNT_NAME_MAX_LENGTH)
  accountName!: string;
}
