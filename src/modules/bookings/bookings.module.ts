import { Module } from '@nestjs/common';
import { AvailabilityModule } from '@/modules/availability/availability.module';
import { AdvisorBookingsController } from './advisor-bookings.controller';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AvailabilityModule],
  controllers: [BookingsController, AdvisorBookingsController],
  providers: [BookingsService, BookingsRepository],
  // The payment module owns PENDING_PAYMENT -> BOOKED through BookingsService.confirmPayment;
  // it must never write service_appointments.state itself.
  exports: [BookingsService],
})
export class BookingsModule {}
