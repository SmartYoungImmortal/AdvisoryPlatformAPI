import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Omise from 'omise';
import { ENV_KEYS } from '@/config/env.constants';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AdminPayoutsController } from './admin-payouts.controller';
import { AdvisorPayoutAccountController } from './advisor-payout-account.controller';
import { AdvisorPayoutsController } from './advisor-payouts.controller';
import { PayoutAccountRepository } from './payout-account.repository';
import {
  OMISE_RECIPIENTS,
  PayoutAccountService,
} from './payout-account.service';
import { PayoutsRepository } from './payouts.repository';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    AdvisorPayoutsController,
    AdvisorPayoutAccountController,
    AdminPayoutsController,
  ],
  providers: [
    PayoutsService,
    PayoutsRepository,
    PayoutAccountService,
    PayoutAccountRepository,
    {
      // The same keys and API version the payment provider's client uses.
      provide: OMISE_RECIPIENTS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        Omise({
          omiseVersion: '2019-05-29',
          secretKey: config.get(ENV_KEYS.OMISE_SECRET_KEY),
          publicKey: config.get(ENV_KEYS.OMISE_PUBLIC_KEY),
        }).recipients,
    },
  ],
})
export class PayoutsModule {}
