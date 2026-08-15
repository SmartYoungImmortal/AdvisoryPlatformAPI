import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { ChatSocketSessionService } from './chat-socket-session.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatRepository,
    ChatService,
    ChatSocketSessionService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
