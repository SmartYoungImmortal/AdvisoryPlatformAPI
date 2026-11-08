import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OmisePaymentProvider } from './providers/omise/omise.service';
import { OmiseRepository } from '@/modules/payment/providers/omise/omise.repository';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import { PaymentServiceInvoicesRepository } from '@/modules/payment/payment.repository';
import { BookingsModule } from '@/modules/bookings/bookings.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';

@Module({
  // A paid charge confirms its booking through `BookingsService.confirmPayment`.
  imports: [BookingsModule, NotificationsModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: IPaymentProvider,
      useClass: OmisePaymentProvider,
    },
    OmiseRepository,
    PaymentServiceInvoicesRepository,
  ],
})
export class PaymentModule {}
