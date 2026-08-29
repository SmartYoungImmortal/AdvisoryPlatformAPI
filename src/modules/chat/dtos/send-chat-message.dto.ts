import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { CHAT_MESSAGE_MAX_LENGTH } from '../chat.constants';

export class SendChatMessageDto {
  @IsUUID()
  chatRoomId!: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(CHAT_MESSAGE_MAX_LENGTH)
  message!: string;
}
