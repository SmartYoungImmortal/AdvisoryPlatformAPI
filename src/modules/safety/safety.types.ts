import type { UserReportStatus } from './safety.constants';

/** One chat line in a case's conversation, with the sender's names. */
export interface CaseMessageRow {
  id: string;
  senderUserId: string;
  senderDisplayName: string;
  senderFullName: string;
  message: string;
  createdAt: Date;
}

/** The consultation a case's conversation belongs to, with its invoice. */
export interface CaseAppointmentRow {
  id: string;
  serviceId: string;
  serviceName: string;
  advisorId: string;
  adviseeId: string;
  type: string;
  state: string;
  startTime: Date;
  endTime: Date;
  cancelledAt: Date | null;
  cancelledByUserId: string | null;
  jitsiRoomName: string | null;
  /** The appointment's own room — how a refund reaches its conversation. */
  chatRoomId: string | null;
  invoiceAmountSatang: number | null;
  invoiceStatus: string | null;
}

/**
 * One row of the admin report queue. A report names two real people, so the join selects
 * exactly `id` and `displayName` for each of them and nothing else: no `email`, no
 * `fullName`, no `banReason`, and nothing from `advisor_identity`.
 *
 * `reason` is the reporter's own words, shown to the admin who rules on it.
 */
export interface AdminReportRow {
  id: string;
  reporterUserId: string;
  reporterDisplayName: string;
  reportedUserId: string;
  reportedDisplayName: string;
  chatRoomId: string | null;
  reason: string;
  status: UserReportStatus;
  reviewedByAdminId: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

/**
 * One row of the reporter's own list. Narrower than the admin row on purpose: the reporter
 * is the caller, so their own identity is redundant, and `reviewedByAdminId` names which
 * admin ruled on them — an internal detail a reported-on party has no claim to.
 */
export interface OwnReportRow {
  id: string;
  reportedUserId: string;
  reportedDisplayName: string;
  chatRoomId: string | null;
  reason: string;
  status: UserReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
}
