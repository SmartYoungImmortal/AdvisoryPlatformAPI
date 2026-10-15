import { ApiProperty } from '@nestjs/swagger';
import type {
  AdminPayoutRow,
  PayoutInvoiceRow,
} from '@/modules/payouts/payouts.types';
import { AdminPayoutResponseDto } from './admin-payout-response.dto';
import { PayoutInvoiceResponseDto } from './payout-invoice-response.dto';

/**
 * The payout plus the invoices it covers, reached through `payout_invoices`. `invoicedTotalSatang`
 * is the integer sum of those invoices' gross amounts, so an operator can see at a glance whether
 * the batch adds up to `amountSatang` before releasing the transfer.
 */
export class AdminPayoutDetailResponseDto extends AdminPayoutResponseDto {
  @ApiProperty({ type: () => [PayoutInvoiceResponseDto] })
  invoices: PayoutInvoiceResponseDto[];
  @ApiProperty({ description: 'Integer satang' }) invoicedTotalSatang: number;

  constructor(row: AdminPayoutRow, invoices: readonly PayoutInvoiceRow[]) {
    super(row);
    this.invoices = invoices.map(
      (invoice) => new PayoutInvoiceResponseDto(invoice),
    );
    this.invoicedTotalSatang = invoices.reduce(
      (total, invoice) => total + invoice.amountSatang,
      0,
    );
  }
}
