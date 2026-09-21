import { Module } from '@nestjs/common';
import { AdminRefundsController } from './admin-refunds.controller';
import { RefundsController } from './refunds.controller';
import { RefundsRepository } from './refunds.repository';
import { RefundsService } from './refunds.service';

@Module({
  controllers: [RefundsController, AdminRefundsController],
  providers: [RefundsService, RefundsRepository],
})
export class RefundsModule {}
