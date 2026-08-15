import { ApiProperty } from '@nestjs/swagger';

export interface VideoAccessView {
  roomName: string;
  domain: string;
  token: string;
  expiresAt: Date;
}

export class VideoAccessResponseDto {
  @ApiProperty() roomName: string;
  @ApiProperty({ example: 'meet.example.com' }) domain: string;
  @ApiProperty({ description: 'Short-lived, room-scoped Jitsi JWT' })
  token: string;
  @ApiProperty() expiresAt: Date;

  constructor(access: VideoAccessView) {
    this.roomName = access.roomName;
    this.domain = access.domain;
    this.token = access.token;
    this.expiresAt = access.expiresAt;
  }
}
