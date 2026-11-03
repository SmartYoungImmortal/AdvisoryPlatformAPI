import { Module } from '@nestjs/common';
import { StorageModule } from '@/common/storage/storage.module';
import { AvailabilityModule } from '@/modules/availability/availability.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AdvisorBookingsController } from './advisor-bookings.controller';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AvailabilityModule, NotificationsModule, StorageModule],
  controllers: [BookingsController, AdvisorBookingsController],
  providers: [BookingsService, BookingsRepository],
  // The payment module owns PENDING_PAYMENT -> BOOKED through BookingsService.confirmPayment;
  // it must never write service_appointments.state itself.
  exports: [BookingsService],
})
export class BookingsModule {}
