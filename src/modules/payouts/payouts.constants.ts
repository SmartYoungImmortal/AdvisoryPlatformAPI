import { crudMessages } from '@/common/constants/crud-messages';

export const PAYOUT_MESSAGES = {
  ...crudMessages('Payout'),
  markedPaid: 'Payout marked as paid',
  markedFailed: 'Payout marked as failed',
  /**
   * `PAID` and `FAILED` are both terminal. A second ruling would rewrite `paidAt` and the transfer
   * id of a transfer that has already happened, so it is a 409 rather than a second write.
   */
  alreadySettled: 'This payout has already been settled',
} as const;

/**
 * The one `payout_status` value a ruling may be applied from. The enum in
 * `src/database/schema/payment.ts` is `PENDING`, `PAID`, `FAILED`; the other two are terminal.
 */
export const PAYOUT_PENDING_STATUS = 'PENDING';
