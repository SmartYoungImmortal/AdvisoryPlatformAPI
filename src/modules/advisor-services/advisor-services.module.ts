import { Module } from '@nestjs/common';
import { StorageModule } from '@/common/storage/storage.module';
import { AvailabilityModule } from '@/modules/availability/availability.module';
import { AdvisorServicesController } from './advisor-services.controller';
import { AdminServicesController } from './admin-services.controller';
import { AdvisorServicesRepository } from './advisor-services.repository';
import { AdvisorServicesService } from './advisor-services.service';
import { PublicServicesController } from './public-services.controller';

@Module({
  imports: [AvailabilityModule, StorageModule],
  controllers: [
    AdvisorServicesController,
    AdminServicesController,
    PublicServicesController,
  ],
  providers: [AdvisorServicesService, AdvisorServicesRepository],
})
export class AdvisorServicesModule {}
