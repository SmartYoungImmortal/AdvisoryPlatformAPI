import { Module } from '@nestjs/common';
import { StorageModule } from '@/common/storage/storage.module';
import { ChatController } from './chat.controller';
import { ChatFilesController } from './chat-files.controller';
import { ChatFilesService } from './chat-files.service';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatSocketSessionService } from './chat-socket-session.service';

@Module({
  imports: [StorageModule],
  controllers: [ChatController, ChatFilesController],
  providers: [
    ChatFilesService,
    ChatGateway,
    ChatRepository,
    ChatService,
    ChatSocketSessionService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
