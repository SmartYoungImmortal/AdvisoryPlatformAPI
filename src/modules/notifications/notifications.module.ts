import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';
import { PushController } from './push/push.controller';
import { PushRepository } from './push/push.repository';
import { PushService } from './push/push.service';

/** Import this module and inject `NotificationsService` to call `notify()`. */
@Module({
  controllers: [NotificationsController, PushController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    PushService,
    PushRepository,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
