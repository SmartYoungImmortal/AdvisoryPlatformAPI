import { Module } from '@nestjs/common';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceCategoriesRepository } from './service-categories.repository';

@Module({
  controllers: [ServiceCategoriesController],
  providers: [ServiceCategoriesService, ServiceCategoriesRepository],
})
export class ServiceCategoriesModule {}
