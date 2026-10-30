import {
  boolean,
  check,
  integer,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import {
  user,
  advisorProfiles,
  serviceAppointments,
  adminProfiles,
} from '@/database/schema';

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'PENDING',
  'HELD_IN_ESCROW',
  'RELEASED',
  'REFUNDED',
  'FAILED',
]);

export const payoutStatusEnum = pgEnum('payout_status', [
  'PENDING',
  'PAID',
  'FAILED',
]);

export const refundCaseStatusEnum = pgEnum('refund_case_status', [
  'OPEN',
  'APPROVED',
  'REJECTED',
]);

/** Feeds `service_invoices.invoice_number`; one sequence for every user, so a number is never reused. */
export const serviceInvoiceNumberSeq = pgSequence('service_invoice_number_seq');

/**
 * A code an Advisee types at checkout for money off: a share of the price or a fixed amount, never
 * both. Codes are stored upper-case and matched that way. A coupon with `maxRedemptions` counts
 * the invoices it has paid for (held or released); one past `expiresAt`, or not `active`, is
 * refused.
 */
export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 32 }).notNull().unique(),
    percentOff: integer('percent_off'),
    amountOffSatang: integer('amount_off_satang'),
    active: boolean('active').notNull().default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    maxRedemptions: integer('max_redemptions'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'coupons_one_kind_of_discount',
      sql`(${table.percentOff} IS NULL) <> (${table.amountOffSatang} IS NULL)`,
    ),
    check(
      'coupons_percent_off_range',
      sql`${table.percentOff} IS NULL OR ${table.percentOff} BETWEEN 1 AND 100`,
    ),
    check(
      'coupons_amount_off_positive',
      sql`${table.amountOffSatang} IS NULL OR ${table.amountOffSatang} > 0`,
    ),
    check('coupons_code_upper', sql`${table.code} = upper(${table.code})`),
  ],
);

export const serviceInvoices = pgTable(
  'service_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // The receipt number, e.g. INV-2026-000123, assigned by Postgres when the row is inserted so
    // no client and no API process can choose or collide on one. The year is the Bangkok calendar
    // year of the insert, which is `created_at`'s year whenever `created_at` takes its own default.
    // A column default cannot read another column, hence `now()` rather than `created_at`.
    // 'FM999999000000' pads to six digits and keeps growing past 999999 instead of truncating.
    invoiceNumber: varchar('invoice_number')
      .notNull()
      .unique()
      .default(
        sql`'INV-' || to_char(now() AT TIME ZONE 'Asia/Bangkok', 'YYYY') || '-' || to_char(nextval('service_invoice_number_seq'), 'FM999999000000')`,
      ),
    amountSatang: integer('amount_satang').notNull(),
    platformFeeSatang: integer('platform_fee_satang').notNull(),
    // The coupon this invoice was priced with, and what it took off: `amountSatang` is already the
    // price less this.
    couponId: uuid('coupon_id').references(() => coupons.id),
    discountSatang: integer('discount_satang').notNull().default(0),
    providerChargeId: varchar('provider_charge_id'),
    status: invoiceStatusEnum('status').notNull().default('PENDING'),
    // When the latest charge outcome was recorded: the success, or the failure. Null while no
    // charge has finished.
    paidAt: timestamp('paid_at', { withTimezone: true }),
    // The card as the payment provider describes it on the charge: its brand and last four
    // digits only. The full number never reaches this API.
    cardBrand: varchar('card_brand'),
    cardLastDigits: varchar('card_last_digits', { length: 4 }),
    // Set to consultation completion + seven days before it may enter a payout.
    payoutEligibleAt: timestamp('payout_eligible_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    modifiedAt: timestamp('modified_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      'service_invoices_amount_satang_nonnegative',
      sql`${table.amountSatang} >= 0`,
    ),
    check(
      'service_invoices_platform_fee_range',
      sql`${table.platformFeeSatang} BETWEEN 0 AND ${table.amountSatang}`,
    ),
  ],
);

export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    advisorId: uuid('advisor_id')
      .notNull()
      .references(() => advisorProfiles.userId),
    amountSatang: integer('amount_satang').notNull(),
    transferFeeSatang: integer('transfer_fee_satang').notNull().default(2000),
    providerTransferId: varchar('provider_transfer_id'),
    status: payoutStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (table) => [
    check('payouts_amount_satang_positive', sql`${table.amountSatang} > 0`),
    check(
      'payouts_transfer_fee_satang_nonnegative',
      sql`${table.transferFeeSatang} >= 0`,
    ),
  ],
);

export const payoutInvoices = pgTable(
  'payout_invoices',
  {
    payoutId: uuid('payout_id')
      .notNull()
      .references(() => payouts.id),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => serviceInvoices.id),
  },
  (table) => [primaryKey({ columns: [table.payoutId, table.invoiceId] })],
);

export const refundCases = pgTable('refund_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => serviceInvoices.id),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => user.id),
  reviewedByAdminId: uuid('reviewed_by_admin_id').references(
    () => adminProfiles.userId,
  ),
  reason: text('reason').notNull(),
  status: refundCaseStatusEnum('status').notNull().default('OPEN'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

export const refundCaseEvidence = pgTable(
  'refund_case_evidence',
  {
    refundCaseId: uuid('refund_case_id')
      .notNull()
      .references(() => refundCases.id),
    objectKey: varchar('object_key').notNull(),
    originalFileName: varchar('original_file_name').notNull(),
    mimeType: varchar('mime_type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.refundCaseId, table.objectKey] })],
);

export const omiseCustomers = pgTable('omise_customers', {
  userId: uuid('user_id')
    .primaryKey()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  customerId: varchar('customer_id').notNull().unique(),
});

export const omiseCards = pgTable('omise_cards', {
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  cardId: varchar('card_id').notNull().primaryKey(),
});

export const omiseBankAccounts = pgTable('omise_bank_accounts', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => user.id),
  bankAccountId: varchar('bank_account_id').notNull().unique(),
  bankName: varchar('bank_name'),
  accountName: varchar('account_name'),
  isDefault: boolean().notNull().default(false),
});

export const serviceAppointmentsOnInvoice = pgTable(
  'service_appointments_on_service_invoices',
  {
    serviceAppointmentId: uuid()
      .references(() => serviceAppointments.id)
      .unique()
      .notNull(),
    serviceInvoiceId: uuid()
      .references(() => serviceInvoices.id)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.serviceAppointmentId, table.serviceInvoiceId],
    }),
  ],
);
