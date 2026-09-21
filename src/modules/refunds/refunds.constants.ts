import { crudMessages } from '@/common/constants/crud-messages';

/**
 * A refund case is opened by the Advisee who paid the invoice and closed by an Admin's single
 * ruling. Both of those are 409 surfaces rather than silent second writes: a second open case on
 * one invoice would let the same payment be disputed twice, and a second ruling on a resolved case
 * would overwrite who decided it and when.
 */
export const REFUND_MESSAGES = {
  ...crudMessages('Refund case'),
  opened: 'Refund case opened',
  approved: 'Refund case approved',
  rejected: 'Refund case rejected',
  /**
   * An invoice the caller has no claim on reads exactly as one that does not exist. A 403 here
   * would confirm that a stranger's payment exists and what its id is.
   */
  invoiceNotFound: 'Invoice not found',
  alreadyOpen: 'This invoice already has an open refund case',
  alreadyResolved: 'This refund case has already been resolved',
} as const;

/**
 * The one `refund_case_status` value a ruling may be applied from. Taken from the enum in
 * `src/database/schema/payment.ts` (`OPEN`, `APPROVED`, `REJECTED`); the other two are terminal.
 */
export const REFUND_CASE_OPEN_STATUS = 'OPEN';

/**
 * Shares the 4,000-character bound the chat message and review text already use rather than
 * inventing a fourth number for free text.
 */
export const REFUND_REASON_MAX_LENGTH = 4_000;
