import { Module } from '@nestjs/common';
import { AdminPayoutsController } from './admin-payouts.controller';
import { AdvisorPayoutsController } from './advisor-payouts.controller';
import { PayoutsRepository } from './payouts.repository';
import { PayoutsService } from './payouts.service';

@Module({
  controllers: [AdvisorPayoutsController, AdminPayoutsController],
  providers: [PayoutsService, PayoutsRepository],
})
export class PayoutsModule {}
