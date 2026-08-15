import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MarkChatReadDto {
  @ApiProperty({ description: 'Last message the current member has seen' })
  @IsUUID()
  messageId!: string;
}

export class MarkChatReadEventDto extends MarkChatReadDto {
  @IsUUID()
  chatRoomId!: string;
}
