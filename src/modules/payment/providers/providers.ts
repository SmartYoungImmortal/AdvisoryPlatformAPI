import { z } from 'zod';

export const FailureCodesMap = {
  confirmed_amount_mismatch:
    'Final amount from payment channel does not match original amount charged',
  failed_fraud_check: 'Card was marked as fraudulent.',
  failed_processing: 'General payment processing failure.',
  'insufficient_balance/insufficient_fund':
    'Insufficient funds in the account or the card has reached the credit limit.',
  'invalid_account_number/invalid_account':
    'Valid account for payment method not found.',
  insufficient_balance:
    'Insufficient funds in the account or the card has reached the credit limit.',
  insufficient_fund:
    'Insufficient funds in the account or the card has reached the credit limit.',
  invalid_account_number: 'Valid account for payment method not found.',
  invalid_account: 'Valid account for payment method not found.',
  payment_cancelled: 'Payment cancelled by payer.',
  payment_expired: 'Payment expired before it was made.',
  payment_rejected: 'Payment rejected by issuer.',
  expired_card: 'Card is expired.',
  stolen_or_lost_card: 'Card stolen or lost.',
  timeout: 'Payment provider did not respond in time.',
  unspecified: 'Other unspecified error.',
} as const;

export const FailureCodeKeys = z.enum(
  Object.keys(FailureCodesMap) as [
    keyof typeof FailureCodesMap,
    ...(keyof typeof FailureCodesMap)[],
  ],
);

export const FailureCodeEnum = FailureCodeKeys.transform(
  (key) => FailureCodesMap[key],
);

export const chargeStatus = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  // `brand` and `lastDigits` are all a receipt may say about the card; an empty string means
  // the provider gave no card (the request itself failed).
  z.object({
    status: z.literal('success'),
    brand: z.string(),
    lastDigits: z.string(),
    redirectUrl: z.url(),
    chargeId: z.string(),
  }),
  z.object({
    status: z.literal('failed'),
    brand: z.string(),
    lastDigits: z.string(),
    errorCode: FailureCodeKeys,
    message: z.string(),
  }),
]);
export type ChargeStatus = z.infer<typeof chargeStatus>;

/**
 * A PromptPay charge as it is made: waiting for the payer to scan its QR code, which is an image
 * anyone can load (the provider serves it without a key) until the charge expires; or refused.
 */
export type PromptPayCharge =
  | {
      status: 'pending';
      chargeId: string;
      qrImageUrl: string;
      expiresAt: string;
    }
  | {
      status: 'failed';
      errorCode: z.infer<typeof FailureCodeKeys>;
      message: string;
    };

/** What a receipt calls a payment that was not made with a card. */
export const PROMPTPAY_BRAND = 'PromptPay';

/**
 * The Thai banks whose app can pay a charge (the provider's `mobile_banking_<bank>` sources),
 * each with the app's name, which is what a receipt calls the payment.
 */
export const MOBILE_BANKS = {
  scb: 'SCB EASY',
  kbank: 'K PLUS',
  ktb: 'Krungthai NEXT',
  bbl: 'Bualuang mBanking',
  bay: 'Krungsri KMA',
} as const;
export type MobileBank = keyof typeof MOBILE_BANKS;
export const MOBILE_BANK_KEYS = Object.keys(MOBILE_BANKS) as MobileBank[];

/** The phone a bank app is opened on, when the browser says; the provider's `platform_type`. */
export const MOBILE_PLATFORMS = ['IOS', 'ANDROID'] as const;
export type MobilePlatform = (typeof MOBILE_PLATFORMS)[number];

/**
 * A mobile banking charge as it is made: waiting for the payer to confirm it in their bank's
 * app, which `authorizeUri` opens (in test mode, a page to mark it paid or failed); or refused.
 */
export type MobileBankingCharge =
  | { status: 'pending'; chargeId: string; authorizeUri: string }
  | {
      status: 'failed';
      errorCode: z.infer<typeof FailureCodeKeys>;
      message: string;
    };
