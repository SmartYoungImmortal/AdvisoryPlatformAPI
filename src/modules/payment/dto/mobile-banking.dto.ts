import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import {
  MOBILE_BANK_KEYS,
  MOBILE_PLATFORMS,
  type MobileBank,
  type MobilePlatform,
} from '@/modules/payment/providers/providers';

/**
 * `POST /payment/mobile-banking`: pay an invoice in a Thai bank's app. The answer is the page that
 * opens the app (`CheckoutResponse.url`); the bank returns the payer to the card's 3-D Secure
 * return, which records the outcome.
 */
export class MobileBankingDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  invoiceId!: string;

  @ApiProperty({ enum: MOBILE_BANK_KEYS })
  @IsIn(MOBILE_BANK_KEYS)
  bank!: MobileBank;

  @ApiProperty({
    enum: MOBILE_PLATFORMS,
    required: false,
    description: 'The phone the app is on, when the browser can tell.',
  })
  @IsOptional()
  @IsIn(MOBILE_PLATFORMS)
  platform?: MobilePlatform;
}
