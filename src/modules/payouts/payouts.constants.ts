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

export const PAYOUT_ACCOUNT_MESSAGES = {
  ...crudMessages('Payout account'),
  saved: 'Payout account saved',
  /** Omise refused the bank account: an unknown number for that bank, or a name it will not take. */
  rejected: 'The bank did not accept this account',
  /** Omise could not be reached, or answered with something other than a refusal of the account. */
  unavailable: 'The payment provider could not be reached',
} as const;

/**
 * The banks an Advisor can be paid into, each by the brand Omise's Thai recipients take
 * (`bank_account[brand]`). Omise answers with the bank's full name in the same field, so the code
 * is kept in `omise_bank_accounts.bank_name` to read back. Checked against Omise test mode: it
 * refuses the older `tmb` and `kkp`, and takes `ttb` and `kk` for those two banks.
 */
export const PAYOUT_BANKS = [
  'bbl',
  'kbank',
  'scb',
  'ktb',
  'bay',
  'ttb',
  'gsb',
  'baac',
  'uob',
  'cimb',
  'kk',
  'lhb',
] as const;

export type PayoutBank = (typeof PAYOUT_BANKS)[number];

/** A Thai account number once spaces and dashes are taken out: 10 digits at most banks, 12 at the GSB and BAAC. */
export const PAYOUT_ACCOUNT_NUMBER_PATTERN = /^\d{10,15}$/;

export const PAYOUT_ACCOUNT_NAME_MAX_LENGTH = 100;
