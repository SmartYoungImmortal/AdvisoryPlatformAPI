import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChatMessageResponseDto,
  type ChatMessageView,
} from './chat-message-response.dto';

/** The other member of a room, as far as a member may see them. */
export interface ChatRoomCounterpartView {
  id: string;
  displayName: string;
  image: string | null;
}

export interface ChatRoomView {
  id: string;
  isAnonymous: boolean;
  lastReadAt: Date | null;
  /** Whether the member reading the room has muted it. */
  isMuted: boolean;
  unreadCount: number;
  createdAt: Date;
  /** Absent or null when the room has no other member to name. */
  counterpart?: ChatRoomCounterpartView | null;
  /** The room's newest line; absent from a view that did not read it, null in an empty room. */
  lastMessage?: ChatMessageView | null;
}

/**
 * Who a room is with: the public display name and better-auth's `image`, a
 * portrait URL that is already public (never a storage key), and nothing else.
 * Email, full name and moderation state stay off this route.
 */
export class ChatRoomCounterpartDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() displayName: string;
  @ApiProperty({ nullable: true, type: String }) image: string | null;

  constructor(counterpart: ChatRoomCounterpartView) {
    this.id = counterpart.id;
    this.displayName = counterpart.displayName;
    this.image = counterpart.image;
  }
}

export class ChatRoomResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() isAnonymous: boolean;
  @ApiPropertyOptional({ nullable: true }) lastReadAt: Date | null;
  /**
   * Whether the signed-in member has muted the room. A muted room's messages still
   * arrive and still count in `unreadCount`; they raise no notification and no push.
   */
  @ApiProperty() isMuted: boolean;
  @ApiProperty({ minimum: 0 }) unreadCount: number;
  @ApiProperty() createdAt: Date;
  /**
   * The other member. Null for an anonymous room, whose point is that it names
   * nobody, and for a room with no other member.
   */
  @ApiProperty({ type: () => ChatRoomCounterpartDto, nullable: true })
  counterpart: ChatRoomCounterpartDto | null;
  /**
   * The newest line in the room, so a list can show it without reading each
   * room's messages. Null in a room with nothing in it yet.
   */
  @ApiProperty({ type: () => ChatMessageResponseDto, nullable: true })
  lastMessage: ChatMessageResponseDto | null;

  constructor(room: ChatRoomView) {
    this.id = room.id;
    this.isAnonymous = room.isAnonymous;
    this.lastReadAt = room.lastReadAt;
    this.isMuted = room.isMuted;
    this.unreadCount = room.unreadCount;
    this.createdAt = room.createdAt;
    this.counterpart =
      room.counterpart && !room.isAnonymous
        ? new ChatRoomCounterpartDto(room.counterpart)
        : null;
    this.lastMessage = room.lastMessage
      ? new ChatMessageResponseDto(room.lastMessage)
      : null;
  }
}
