import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdvisorServicesModule } from '@/modules/advisor-services/advisor-services.module';
import { ServiceCategoriesModule } from '@/modules/service-categories/service-categories.module';
import { MatchingController } from './matching.controller';
import {
  MATCHING_MODEL_CLIENT,
  createMatchingModelClient,
} from './matching.model-client';
import { MatchingService } from './matching.service';

@Module({
  imports: [AdvisorServicesModule, ServiceCategoriesModule],
  controllers: [MatchingController],
  providers: [
    MatchingService,
    {
      provide: MATCHING_MODEL_CLIENT,
      inject: [ConfigService],
      useFactory: createMatchingModelClient,
    },
  ],
})
export class MatchingModule {}
