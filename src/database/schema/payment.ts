import {
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { boolean } from 'drizzle-orm/pg-core';
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

export const serviceInvoices = pgTable(
  'service_invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    appointmentId: uuid('appointment_id')
      .notNull()
      .unique()
      .references(() => serviceAppointments.id),
    amountSatang: integer('amount_satang').notNull(),
    platformFeeSatang: integer('platform_fee_satang').notNull(),
    providerChargeId: varchar('provider_charge_id'),
    status: invoiceStatusEnum('status').notNull().default('PENDING'),
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
    providerTransferId: varchar('provider_transfer_id'),
    status: payoutStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (table) => [
    check('payouts_amount_satang_positive', sql`${table.amountSatang} > 0`),
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
  userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  bankAccountId: varchar('bank_account_id').notNull().primaryKey(),
  isDefault: boolean().notNull().default(false),
});
