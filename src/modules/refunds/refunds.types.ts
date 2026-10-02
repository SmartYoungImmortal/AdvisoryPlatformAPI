import type { InferSelectModel } from 'drizzle-orm';
import type { refundCases } from '@/database/schema';

export type RefundCase = InferSelectModel<typeof refundCases>;
export type RefundCaseStatus = RefundCase['status'];

/**
 * One row of the Admin queue. The queue card names who asked and what the disputed payment was
 * worth, so the requester and the invoice are joined in the repository rather than fetched per
 * row by the service. `invoiceAmountSatang` is integer satang, as every monetary value in this
 * API is; nothing here divides it into baht.
 */
export interface AdminRefundCaseRow {
  id: string;
  invoiceId: string;
  requestedByUserId: string;
  requesterDisplayName: string;
  invoiceAmountSatang: number;
  reason: string;
  status: RefundCaseStatus;
  reviewedByAdminId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

/**
 * An uploaded evidence file, referenced by its SeaweedFS object key. This API stores and returns
 * object keys, never object URLs.
 */
export interface RefundCaseEvidenceRow {
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  createdAt: Date;
}

/** The little an invoice has to give up for the ownership check to pass and a case to be opened. */
export interface DisputableInvoice {
  id: string;
  amountSatang: number;
}
