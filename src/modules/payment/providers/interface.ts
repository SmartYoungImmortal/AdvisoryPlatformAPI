import type { SessionUser } from '@/modules/auth/auth.config';
import type {
  ChargeStatus,
  PromptPayCharge,
} from '@/modules/payment/providers/providers';

export abstract class IPaymentProvider {
  abstract chargeSpecificCard(
    user: SessionUser,
    amount: number,
    cardId: string,
    redirectUri: string,
  ): Promise<ChargeStatus>;
  /** A charge paid by scanning a PromptPay QR code, which stops working at `expiresAt`. */
  abstract chargePromptPay(
    amount: number,
    expiresAt: Date,
  ): Promise<PromptPayCharge>;
  abstract getChargeStatus(chargeId: string): Promise<ChargeStatus>;
}
