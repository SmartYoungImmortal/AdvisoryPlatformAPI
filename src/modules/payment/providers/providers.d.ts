import z from 'zod';

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
  payment_rejected: 'Payment rejected by issuer.',
  expired_card: 'Card is expired.',
  stolen_or_lost_card: 'Card stolen or lost.',
  timeout: 'Payment provider did not respond in time.',
  unspecified: 'Other unspeciffied error.',
} as const;
export const FailureCodeKeys = z.enum(
  Object.keys(FailureCodesMap) as [
    keyof typeof FailureCodesMap,
    ...(keyof typeof FailureCodesMap)[],
  ],
);
export const FailureCodeEnum = z.enum(FailureCodesMap);
export const chargeStatus = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('success') }),
  z.object({
    status: z.literal('failed'),
    errorCode: FailureCodeKeys,
    message: z.string(),
  }),
]);
export type ChargeStatus = z.infer<typeof chargeStatus>;

export interface IPaymentProvider {
  createCustomerAndBindCard(
    user: SessionUser,
    cardToken: string,
  ): Promise<void>;
  chargeDefaultCard(user: SessionUser, amount: number): Promise<ChargeStatus>;
  chargeSpecificCard(
    user: SessionUser,
    amount: number,
    cardId: string,
  ): Promise<ChargeStatus>;
}
