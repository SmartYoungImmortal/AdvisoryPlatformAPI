import { ApiProperty } from '@nestjs/swagger';

export class UserAvatarUrlResponseDto {
  @ApiProperty({ format: 'uri' }) url: string;
  @ApiProperty({ example: 300 }) expiresInSeconds: number;

  constructor(url: string, expiresInSeconds: number) {
    this.url = url;
    this.expiresInSeconds = expiresInSeconds;
  }
}
