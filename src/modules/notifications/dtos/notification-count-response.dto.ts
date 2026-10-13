import { ApiProperty } from '@nestjs/swagger';

/** Unread notifications, or how many a mark-all-read changed. */
export class NotificationCountResponseDto {
  @ApiProperty() count: number;

  constructor(count: number) {
    this.count = count;
  }
}
