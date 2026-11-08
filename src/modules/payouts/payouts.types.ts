import type { InferSelectModel } from 'drizzle-orm';
import type {
  omiseBankAccounts,
  payouts,
  serviceInvoices,
} from '@/database/schema';
import type { PayoutBank } from './payouts.constants';

export type Payout = InferSelectModel<typeof payouts>;
export type PayoutAccountRow = InferSelectModel<typeof omiseBankAccounts>;

/**
 * An Advisor's payout account: the row that names their Omise recipient, read together with the
 * recipient itself. `lastDigits` is null and the two flags false when Omise could not be reached.
 */
export interface PayoutAccount {
  bank: PayoutBank;
  accountName: string;
  lastDigits: string | null;
  verified: boolean;
  active: boolean;
  createdAt: Date | null;
}
export type PayoutStatus = Payout['status'];
type InvoiceStatus = InferSelectModel<typeof serviceInvoices>['status'];

/**
 * One row of the Admin payout queue: the payout plus the Advisor it pays. Every monetary field is
 * integer satang, and `transferFeeSatang` is carried separately because the ER records the fee on
 * the payout rather than inferring it from either party's balance.
 */
export interface AdminPayoutRow {
  id: string;
  advisorId: string;
  advisorDisplayName: string;
  amountSatang: number;
  transferFeeSatang: number;
  providerTransferId: string | null;
  status: PayoutStatus;
  createdAt: Date;
  paidAt: Date | null;
}

/**
 * One invoice a payout settles, reached through `payout_invoices`. Amounts stay integer satang;
 * the frontend formats them into baht, the API never divides.
 */
export interface PayoutInvoiceRow {
  invoiceId: string;
  appointmentId: string;
  amountSatang: number;
  platformFeeSatang: number;
  status: InvoiceStatus;
  payoutEligibleAt: Date | null;
  createdAt: Date;
}
