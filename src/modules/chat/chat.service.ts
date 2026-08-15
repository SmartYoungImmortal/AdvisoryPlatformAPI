import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  type CursorPaginatedResult,
} from '@/common/pagination/cursor-pagination.dto';
import {
  paginate,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { CHAT_MESSAGES } from './chat.constants';
import { ChatRepository } from './chat.repository';
import { ChatMessageResponseDto } from './dtos/chat-message-response.dto';
import { ChatMessageQueryDto, ChatQueryDto } from './dtos/chat-query.dto';
import { ChatReadResponseDto } from './dtos/chat-read-response.dto';
import { ChatRoomResponseDto } from './dtos/chat-room-response.dto';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async findRooms(
    memberUserId: string,
    query: ChatQueryDto,
  ): Promise<PaginatedResult<ChatRoomResponseDto>> {
    const [rooms, total] = await Promise.all([
      this.chatRepository.findRoomsForMember(
        memberUserId,
        query.limit,
        query.offset,
      ),
      this.chatRepository.countRoomsForMember(memberUserId),
    ]);

    return paginate(
      rooms.map((room) => new ChatRoomResponseDto(room)),
      total,
      query,
    );
  }

  async findMessages(
    memberUserId: string,
    chatRoomId: string,
    query: ChatMessageQueryDto,
  ): Promise<CursorPaginatedResult<ChatMessageResponseDto>> {
    await this.assertMember(chatRoomId, memberUserId);
    const cursor = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    if (query.cursor && !cursor) {
      throw new BadRequestException(CHAT_MESSAGES.invalidCursor);
    }

    const messages = await this.chatRepository.findMessages(
      chatRoomId,
      query.limit + 1,
      cursor,
    );
    const hasMore = messages.length > query.limit;
    const page = messages.slice(0, query.limit);
    const last = page.at(-1);

    return {
      items: page.map((message) => new ChatMessageResponseDto(message)),
      limit: query.limit,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }

  async sendMessage(
    memberUserId: string,
    chatRoomId: string,
    message: string,
  ): Promise<ChatMessageResponseDto> {
    const created = await this.chatRepository.createMessageForMember(
      chatRoomId,
      memberUserId,
      message,
    );

    if (!created) {
      throw new NotFoundException(CHAT_MESSAGES.roomNotFound);
    }

    return new ChatMessageResponseDto(created);
  }

  async markRead(
    memberUserId: string,
    chatRoomId: string,
    messageId: string,
  ): Promise<ChatReadResponseDto> {
    await this.assertMember(chatRoomId, memberUserId);
    const readState = await this.chatRepository.markReadThroughMessage(
      chatRoomId,
      memberUserId,
      messageId,
    );

    if (!readState) {
      throw new NotFoundException(CHAT_MESSAGES.messageNotFound);
    }

    return new ChatReadResponseDto(readState);
  }

  async assertMember(chatRoomId: string, memberUserId: string): Promise<void> {
    const membership = await this.chatRepository.findMembership(
      chatRoomId,
      memberUserId,
    );
    if (!membership) {
      throw new NotFoundException(CHAT_MESSAGES.roomNotFound);
    }
  }
}
