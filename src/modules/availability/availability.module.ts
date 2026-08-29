import { Module } from '@nestjs/common';
import { AvailabilityController } from './availability.controller';
import { AvailabilityRepository } from './availability.repository';
import { AvailabilityService } from './availability.service';
import { ServiceSlotsController } from './service-slots.controller';

@Module({
  controllers: [AvailabilityController, ServiceSlotsController],
  providers: [AvailabilityService, AvailabilityRepository],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
