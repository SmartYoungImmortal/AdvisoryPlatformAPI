import type { SessionUser } from '@/modules/auth/auth.config';
import type { ChargeStatus } from '@/modules/payment/providers/providers';

export abstract class IPaymentProvider {
  abstract chargeSpecificCard(
    user: SessionUser,
    amount: number,
    cardId: string,
    redirectUri: string,
  ): Promise<ChargeStatus>;
}
