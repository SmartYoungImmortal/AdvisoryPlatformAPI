import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class MuteChatRoomDto {
  @ApiProperty({
    description:
      'True stops this room notifying the current member (no notification, no push); false lets it notify them again',
  })
  @IsBoolean()
  muted!: boolean;
}
