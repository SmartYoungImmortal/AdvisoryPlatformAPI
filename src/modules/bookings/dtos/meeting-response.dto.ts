import { ApiProperty } from '@nestjs/swagger';

/** `POST /bookings/:bookingId/meeting`: where the session's video call is. */
export class MeetingResponseDto {
  @ApiProperty({ format: 'uri' }) url: string;

  constructor(url: string) {
    this.url = url;
  }
}
