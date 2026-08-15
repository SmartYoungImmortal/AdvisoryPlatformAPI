import { ApiProperty } from '@nestjs/swagger';

export class UserAvatarResponseDto {
  @ApiProperty({ nullable: true }) avatarKey: string | null;

  constructor(avatarKey: string | null) {
    this.avatarKey = avatarKey;
  }
}
