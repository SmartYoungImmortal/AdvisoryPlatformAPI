import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  unreadCount: number;
  createdAt: Date;
  /** Absent or null when the room has no other member to name. */
  counterpart?: ChatRoomCounterpartView | null;
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
  @ApiProperty({ minimum: 0 }) unreadCount: number;
  @ApiProperty() createdAt: Date;
  /**
   * The other member. Null for an anonymous room, whose point is that it names
   * nobody, and for a room with no other member.
   */
  @ApiProperty({ type: () => ChatRoomCounterpartDto, nullable: true })
  counterpart: ChatRoomCounterpartDto | null;

  constructor(room: ChatRoomView) {
    this.id = room.id;
    this.isAnonymous = room.isAnonymous;
    this.lastReadAt = room.lastReadAt;
    this.unreadCount = room.unreadCount;
    this.createdAt = room.createdAt;
    this.counterpart =
      room.counterpart && !room.isAnonymous
        ? new ChatRoomCounterpartDto(room.counterpart)
        : null;
  }
}
