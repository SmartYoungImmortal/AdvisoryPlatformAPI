import { crudMessages } from '@/common/constants/crud-messages';

export const PaymentConfig = {
  messages: {
    crudInvoice: crudMessages('Invoice'),
    duplicateStartTimes: 'Duplicate start times.',
    exceedPendingInvoiceLimit:
      'Your active invoices reached a limit. You cannot create more invoices.',
    serviceNotFound: 'Service not found.',
    overlappingAppointments: 'Overlapping Appointments.',
    bookingNotFound: 'Booking not found.',
    bookingNotPayable: 'This booking is not waiting for payment.',
    couponNotValid: 'This coupon is not valid.',
    invoiceNotPayable: 'This invoice is not waiting for payment.',
  },
  invoice: {
    pendingLimit: 1,
    pendingLimitSeconds: 60 * 10,
    platformFeeFraction: 0.2,
    createRedirectPath: '/checkout/',
  },
  checkout: {
    redirectPaths: {
      callback: '/api/v1/payment/callback',
    },
  },
  checkoutCallback: {
    redirectPaths: {
      success: '/checkout/success',
      failed: '/checkout/failed',
      pending: '/checkout/unconfirmed',
    },
  },
  /** The advisee's notification once a charge succeeds; the content is the amount. */
  paidNotification: {
    title: 'ชำระเงินสำเร็จ',
    en: { title: 'Payment successful' },
  },
  /**
   * The advisee's notification when a charge is declined or a PromptPay code expires unpaid; the
   * content is the amount and what to do next.
   */
  failedNotification: {
    title: 'ชำระเงินไม่สำเร็จ',
    content: (amount: string) => `${amount} · ลองชำระเงินอีกครั้ง`,
    en: {
      title: 'Payment failed',
      content: (amount: string) => `${amount} · please try paying again`,
    },
  },
  /** How long a PromptPay QR code can be paid before it expires and a new one is needed. */
  promptPay: {
    expiresMinutes: 15,
  },
} as const;
