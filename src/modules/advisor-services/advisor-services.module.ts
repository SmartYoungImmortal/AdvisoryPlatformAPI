import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@/common/search/elasticsearch.module';
import { AdvisorServicesController } from './advisor-services.controller';
import { AdminServicesController } from './admin-services.controller';
import { AdvisorServicesRepository } from './advisor-services.repository';
import { AdvisorServicesService } from './advisor-services.service';
import { PublicServicesController } from './public-services.controller';

@Module({
  imports: [ElasticsearchModule],
  controllers: [
    AdvisorServicesController,
    AdminServicesController,
    PublicServicesController,
  ],
  providers: [AdvisorServicesService, AdvisorServicesRepository],
})
export class AdvisorServicesModule {}
