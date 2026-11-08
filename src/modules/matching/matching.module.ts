import { Module } from '@nestjs/common';
import { AdvisorServicesModule } from '@/modules/advisor-services/advisor-services.module';
import { ServiceCategoriesModule } from '@/modules/service-categories/service-categories.module';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';

@Module({
  imports: [AdvisorServicesModule, ServiceCategoriesModule],
  controllers: [MatchingController],
  providers: [MatchingService],
})
export class MatchingModule {}
