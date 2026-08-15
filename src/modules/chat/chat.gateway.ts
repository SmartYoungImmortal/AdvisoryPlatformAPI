import { HttpException, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import {
  CHAT_EVENTS,
  CHAT_MESSAGES,
  CHAT_NAMESPACE,
  chatSocketRoom,
} from './chat.constants';
import type {
  ChatInterServerEvents,
  ChatServerToClientEvents,
  ChatClientToServerEvents,
  ChatSocketData,
  ChatSocketError,
} from './chat-socket.types';
import { ChatSocketSessionService } from './chat-socket-session.service';
import type { ChatSocket } from './chat-socket-session.service';
import { ChatService } from './chat.service';
import type { ChatMessageResponseDto } from './dtos/chat-message-response.dto';
import { ChatRoomEventDto } from './dtos/chat-room-event.dto';
import type { ChatReadResponseDto } from './dtos/chat-read-response.dto';
import { MarkChatReadEventDto } from './dtos/mark-chat-read.dto';
import { SendChatMessageDto } from './dtos/send-chat-message.dto';

type ChatServer = Server<
  ChatClientToServerEvents,
  ChatServerToClientEvents,
  ChatInterServerEvents,
  ChatSocketData
>;

@WebSocketGateway({ namespace: CHAT_NAMESPACE })
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: () =>
      new WsException({ statusCode: 400, message: 'Validation failed' }),
  }),
)
export class ChatGateway implements OnGatewayInit<ChatServer> {
  @WebSocketServer()
  private server!: ChatServer;

  constructor(
    private readonly chatService: ChatService,
    private readonly socketSession: ChatSocketSessionService,
  ) {}

  afterInit(server: ChatServer): void {
    server.use((client, next) => {
      void this.socketSession
        .authenticate(client)
        .then(() => next())
        .catch((error: unknown) => next(this.toConnectError(error)));
    });
  }

  @SubscribeMessage(CHAT_EVENTS.join)
  join(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: ChatRoomEventDto,
  ): Promise<ChatRoomEventDto> {
    return this.execute(async () => {
      const user = await this.socketSession.authenticate(client);
      await this.chatService.assertMember(dto.chatRoomId, user.id);
      await client.join(chatSocketRoom(dto.chatRoomId));
      return dto;
    });
  }

  @SubscribeMessage(CHAT_EVENTS.leave)
  leave(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: ChatRoomEventDto,
  ): Promise<ChatRoomEventDto> {
    return this.execute(async () => {
      const user = await this.socketSession.authenticate(client);
      await this.chatService.assertMember(dto.chatRoomId, user.id);
      await client.leave(chatSocketRoom(dto.chatRoomId));
      return dto;
    });
  }

  @SubscribeMessage(CHAT_EVENTS.send)
  send(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: SendChatMessageDto,
  ): Promise<ChatMessageResponseDto> {
    return this.execute(async () => {
      const user = await this.socketSession.authenticate(client);
      const message = await this.chatService.sendMessage(
        user.id,
        dto.chatRoomId,
        dto.message,
      );
      this.server
        .to(chatSocketRoom(dto.chatRoomId))
        .emit(CHAT_EVENTS.message, message);
      return message;
    });
  }

  @SubscribeMessage(CHAT_EVENTS.markRead)
  markRead(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() dto: MarkChatReadEventDto,
  ): Promise<ChatReadResponseDto> {
    return this.execute(async () => {
      const user = await this.socketSession.authenticate(client);
      const readState = await this.chatService.markRead(
        user.id,
        dto.chatRoomId,
        dto.messageId,
      );
      this.server
        .to(chatSocketRoom(dto.chatRoomId))
        .emit(CHAT_EVENTS.read, readState);
      return readState;
    });
  }

  private async execute<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException(this.socketError(error));
    }
  }

  private toConnectError(error: unknown): Error {
    const data = this.socketError(error);
    const connectError = new Error(data.message) as Error & {
      data: ChatSocketError;
    };
    connectError.data = data;
    return connectError;
  }

  private socketError(error: unknown): ChatSocketError {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? String(response.message)
            : error.message;
      return { statusCode: error.getStatus(), message };
    }
    return { statusCode: 500, message: CHAT_MESSAGES.internalError };
  }
}
