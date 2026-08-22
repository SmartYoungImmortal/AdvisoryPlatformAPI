import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OmisePaymentProvider } from './providers/omise/omise.service';
import { OmiseRepository } from '@/modules/payment/providers/omise/omise.repository';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, OmisePaymentProvider, OmiseRepository],
})
export class PaymentModule {}
