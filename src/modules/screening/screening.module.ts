import { Module } from '@nestjs/common';
import { AdvisorScreeningController } from './advisor-screening.controller';
import { ScreeningController } from './screening.controller';
import { ScreeningRepository } from './screening.repository';
import { ScreeningService } from './screening.service';

@Module({
  controllers: [ScreeningController, AdvisorScreeningController],
  providers: [ScreeningService, ScreeningRepository],
})
export class ScreeningModule {}
