import { Module } from '@nestjs/common';
import { StorageModule } from '@/common/storage/storage.module';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { ChatMessageNotifier } from './chat-message-notifier';
import { ChatController } from './chat.controller';
import { ChatFilesController } from './chat-files.controller';
import { ChatFilesService } from './chat-files.service';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatSocketSessionService } from './chat-socket-session.service';

@Module({
  imports: [StorageModule, NotificationsModule],
  controllers: [ChatController, ChatFilesController],
  providers: [
    ChatFilesService,
    ChatGateway,
    ChatMessageNotifier,
    ChatRepository,
    ChatService,
    ChatSocketSessionService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
