import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/** `POST /payment/promptpay`: pay an invoice by scanning a PromptPay QR code. */
export class PromptPayDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  invoiceId!: string;
}

/** The QR code to scan, what it charges, and when it stops working. */
export class PromptPayResponse {
  @ApiProperty({
    format: 'uri',
    description: 'An SVG of the QR code, served by the provider without a key.',
  })
  qrImageUrl!: string;

  @ApiProperty() amountSatang!: number;

  @ApiProperty({ format: 'date-time' }) expiresAt!: string;
}

/**
 * `GET /payment/invoice/:id/promptpay-status`: whether the QR code has been paid. `url` is where
 * checkout goes once the outcome is known (the same pages the card's 3-D Secure return leads to);
 * null while the code is still waiting to be scanned.
 */
export class PromptPayStatusResponse {
  @ApiProperty({ enum: ['pending', 'success', 'failed'] })
  status!: 'pending' | 'success' | 'failed';

  @ApiProperty({ type: String, nullable: true }) url!: string | null;
}
