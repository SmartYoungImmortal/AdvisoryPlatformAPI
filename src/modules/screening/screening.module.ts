import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AdvisorScreeningController } from './advisor-screening.controller';
import { ScreeningController } from './screening.controller';
import { ScreeningRepository } from './screening.repository';
import { ScreeningService } from './screening.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ScreeningController, AdvisorScreeningController],
  providers: [ScreeningService, ScreeningRepository],
})
export class ScreeningModule {}
