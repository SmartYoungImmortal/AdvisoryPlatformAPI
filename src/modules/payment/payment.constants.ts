import { crudMessages } from '@/common/constants/crud-messages';

export const PaymentConfig = {
  messages: {
    crudInvoice: crudMessages('Invoice'),
    duplicateStartTimes: 'Duplicate start times.',
    exceedPendingInvoiceLimit:
      'Your active invoices reached a limit. You cannot create more invoices.',
    serviceNotFound: 'Service not found.',
    overlappingAppointments: 'Overlapping Appointments.',
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
} as const;
