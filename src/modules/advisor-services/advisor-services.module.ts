import { Module } from '@nestjs/common';
import { AdvisorServicesController } from './advisor-services.controller';
import { AdvisorServicesRepository } from './advisor-services.repository';
import { AdvisorServicesService } from './advisor-services.service';

@Module({
  controllers: [AdvisorServicesController],
  providers: [AdvisorServicesService, AdvisorServicesRepository],
})
export class AdvisorServicesModule {}
