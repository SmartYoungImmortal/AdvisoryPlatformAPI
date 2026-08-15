import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export interface ChatRoomView {
  id: string;
  isAnonymous: boolean;
  lastReadAt: Date | null;
  unreadCount: number;
  createdAt: Date;
}

export class ChatRoomResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() isAnonymous: boolean;
  @ApiPropertyOptional({ nullable: true }) lastReadAt: Date | null;
  @ApiProperty({ minimum: 0 }) unreadCount: number;
  @ApiProperty() createdAt: Date;

  constructor(room: ChatRoomView) {
    this.id = room.id;
    this.isAnonymous = room.isAnonymous;
    this.lastReadAt = room.lastReadAt;
    this.unreadCount = room.unreadCount;
    this.createdAt = room.createdAt;
  }
}
