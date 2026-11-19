import { Module } from '@nestjs/common';
import { ChatModule } from '@/modules/chat/chat.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { AdvisorTrialsController } from './advisor-trials.controller';
import { ChatTrialsController } from './chat-trials.controller';
import { TrialsController } from './trials.controller';
import { TrialsRepository } from './trials.repository';
import { TrialsService } from './trials.service';

@Module({
  imports: [ChatModule, NotificationsModule],
  controllers: [
    TrialsController,
    ChatTrialsController,
    AdvisorTrialsController,
  ],
  providers: [TrialsService, TrialsRepository],
})
export class TrialsModule {}
