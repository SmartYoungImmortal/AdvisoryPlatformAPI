import { ApiProperty } from '@nestjs/swagger';

export interface ChatMessageView {
  id: string;
  chatRoomId: string;
  senderUserId: string;
  message: string;
  createdAt: Date;
}

export class ChatMessageResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() chatRoomId: string;
  @ApiProperty() senderUserId: string;
  @ApiProperty() message: string;
  @ApiProperty() createdAt: Date;

  constructor(message: ChatMessageView) {
    this.id = message.id;
    this.chatRoomId = message.chatRoomId;
    this.senderUserId = message.senderUserId;
    this.message = message.message;
    this.createdAt = message.createdAt;
  }
}
