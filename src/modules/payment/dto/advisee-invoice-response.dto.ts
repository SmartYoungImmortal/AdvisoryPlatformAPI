import { ApiProperty } from '@nestjs/swagger';
import type { AdviseeInvoiceRow } from '@/modules/payment/payment.repository';

export const ADVISEE_INVOICE_STATUSES = [
  'paid',
  'refunded',
  'failed',
  'pending',
] as const;
export type AdviseeInvoiceStatus = (typeof ADVISEE_INVOICE_STATUSES)[number];

export const INVOICE_BOOKING_STATUSES = [
  'confirmed',
  'unconfirmed',
  'cancelled',
] as const;
export type InvoiceBookingStatus = (typeof INVOICE_BOOKING_STATUSES)[number];

type InvoiceStatus = AdviseeInvoiceRow['invoice']['status'];
type AppointmentState = AdviseeInvoiceRow['appointment']['state'];

/**
 * What the Advisee sees of the money. Escrow and release are the platform's bookkeeping; to the
 * person who paid, both mean the charge went through.
 */
const STATUS_BY_INVOICE_STATUS: Record<InvoiceStatus, AdviseeInvoiceStatus> = {
  PENDING: 'pending',
  HELD_IN_ESCROW: 'paid',
  RELEASED: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
};

/**
 * The booking as a receipt describes it. Once payment confirmed it, a booking stays confirmed
 * through the session, its completion and a no-show: none of those undo what was booked.
 */
const BOOKING_BY_APPOINTMENT_STATE: Record<
  AppointmentState,
  InvoiceBookingStatus
> = {
  PENDING_PAYMENT: 'unconfirmed',
  BOOKED: 'confirmed',
  IN_PROGRESS: 'confirmed',
  COMPLETED: 'confirmed',
  NO_SHOW: 'confirmed',
  CANCELLED: 'cancelled',
};

export class AdviseeInvoiceServiceDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
}

export class AdviseeInvoiceAdvisorDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  /** The Advisor's public display name, never their legal name or email. */
  @ApiProperty() displayName!: string;
}

export class AdviseeInvoiceSessionDto {
  @ApiProperty({ format: 'date-time' }) startTime!: Date;
  @ApiProperty({ format: 'date-time' }) endTime!: Date;
}

/** All a receipt may say about a card. The full number never reaches this API. */
export class AdviseeInvoiceCardDto {
  @ApiProperty({ example: 'Visa' }) brand!: string;
  @ApiProperty({ example: '4242', minLength: 4, maxLength: 4 })
  lastDigits!: string;
}

/**
 * One line of the Advisee's transaction history, and the receipt behind it
 * (`GET /payment/invoices` and `GET /payment/invoices/:id`).
 */
export class AdviseeInvoiceResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  /** Assigned by the database and unique across every user, e.g. INV-2026-000123. */
  @ApiProperty({ example: 'INV-2026-000123' }) invoiceNumber: string;
  @ApiProperty({ enum: ADVISEE_INVOICE_STATUSES })
  status: AdviseeInvoiceStatus;
  /** What was charged. */
  @ApiProperty() amountSatang: number;
  @ApiProperty() platformFeeSatang: number;
  /** The Advisor's part: `amountSatang - platformFeeSatang`. */
  @ApiProperty() priceSatang: number;
  /** The whole charge when the invoice was refunded, otherwise null. */
  @ApiProperty({ nullable: true, type: Number })
  refundSatang: number | null;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  /** When the charge's outcome was recorded: the success, or the failure. */
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  paidAt: Date | null;
  @ApiProperty({ type: () => AdviseeInvoiceServiceDto })
  service: AdviseeInvoiceServiceDto;
  @ApiProperty({ type: () => AdviseeInvoiceAdvisorDto })
  advisor: AdviseeInvoiceAdvisorDto;
  /**
   * The invoice's earliest appointment. An invoice is found through its appointments, so the
   * routes always fill this; null stays in the contract for an invoice that has none.
   */
  @ApiProperty({ type: () => AdviseeInvoiceSessionDto, nullable: true })
  session: AdviseeInvoiceSessionDto | null;
  /** That appointment's booking, by the same rule as `session`. */
  @ApiProperty({ enum: INVOICE_BOOKING_STATUSES, nullable: true })
  booking: InvoiceBookingStatus | null;
  /** Null until a charge has named a card. */
  @ApiProperty({ type: () => AdviseeInvoiceCardDto, nullable: true })
  card: AdviseeInvoiceCardDto | null;

  constructor(row: AdviseeInvoiceRow) {
    const { invoice, appointment } = row;
    const status = STATUS_BY_INVOICE_STATUS[invoice.status];
    this.id = invoice.id;
    this.invoiceNumber = invoice.invoiceNumber;
    this.status = status;
    this.amountSatang = invoice.amountSatang;
    this.platformFeeSatang = invoice.platformFeeSatang;
    this.priceSatang = invoice.amountSatang - invoice.platformFeeSatang;
    this.refundSatang = status === 'refunded' ? invoice.amountSatang : null;
    this.createdAt = invoice.createdAt;
    this.paidAt = invoice.paidAt;
    this.service = { id: row.service.id, name: row.service.name };
    this.advisor = { id: row.advisor.id, displayName: row.advisor.displayName };
    this.session = {
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    };
    this.booking = appointment.cancelledAt
      ? 'cancelled'
      : BOOKING_BY_APPOINTMENT_STATE[appointment.state];
    this.card =
      invoice.cardBrand && invoice.cardLastDigits
        ? { brand: invoice.cardBrand, lastDigits: invoice.cardLastDigits }
        : null;
  }
}
