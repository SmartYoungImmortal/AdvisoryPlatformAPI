import { ApiProperty } from '@nestjs/swagger';

export interface ChatReadView {
  chatRoomId: string;
  memberUserId: string;
  messageId: string;
  lastReadAt: Date;
}

export class ChatReadResponseDto {
  @ApiProperty() chatRoomId: string;
  @ApiProperty() memberUserId: string;
  @ApiProperty() messageId: string;
  @ApiProperty() lastReadAt: Date;

  constructor(readState: ChatReadView) {
    this.chatRoomId = readState.chatRoomId;
    this.memberUserId = readState.memberUserId;
    this.messageId = readState.messageId;
    this.lastReadAt = readState.lastReadAt;
  }
}
