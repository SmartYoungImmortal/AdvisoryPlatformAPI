import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { CHAT_MESSAGES } from './chat.constants';
import { ChatService } from './chat.service';
import { ChatMessageResponseDto } from './dtos/chat-message-response.dto';
import { ChatQueryDto } from './dtos/chat-query.dto';
import { MarkChatReadDto } from './dtos/mark-chat-read.dto';
import { ChatReadResponseDto } from './dtos/chat-read-response.dto';
import { ChatRoomResponseDto } from './dtos/chat-room-response.dto';

@ApiTags('Chat')
@Controller('api/v1/chat/rooms')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ResponseMessage(CHAT_MESSAGES.roomsFound)
  @ApiGetPaginated(ChatRoomResponseDto)
  findRooms(
    @CurrentUser() user: SessionUser,
    @Query() query: ChatQueryDto,
  ): Promise<PaginatedResult<ChatRoomResponseDto>> {
    return this.chatService.findRooms(user.id, query);
  }

  @Get(':chatRoomId/messages')
  @ResponseMessage(CHAT_MESSAGES.messagesFound)
  @ApiGetPaginated(ChatMessageResponseDto)
  findMessages(
    @CurrentUser() user: SessionUser,
    @Param('chatRoomId', ParseUUIDPipe) chatRoomId: string,
    @Query() query: ChatQueryDto,
  ): Promise<PaginatedResult<ChatMessageResponseDto>> {
    return this.chatService.findMessages(user.id, chatRoomId, query);
  }

  @Patch(':chatRoomId/read')
  @ResponseMessage(CHAT_MESSAGES.readUpdated)
  @ApiUpdate(ChatReadResponseDto)
  markRead(
    @CurrentUser() user: SessionUser,
    @Param('chatRoomId', ParseUUIDPipe) chatRoomId: string,
    @Body() dto: MarkChatReadDto,
  ): Promise<ChatReadResponseDto> {
    return this.chatService.markRead(user.id, chatRoomId, dto.messageId);
  }
}
