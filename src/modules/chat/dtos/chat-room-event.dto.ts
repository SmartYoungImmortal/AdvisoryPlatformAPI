import { IsUUID } from 'class-validator';

export class ChatRoomEventDto {
  @IsUUID()
  chatRoomId!: string;
}
