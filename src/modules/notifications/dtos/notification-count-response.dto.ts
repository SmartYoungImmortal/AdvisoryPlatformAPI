import { ApiProperty } from '@nestjs/swagger';

/** A count: unread notifications, or how many were just marked as read. */
export class NotificationCountResponseDto {
  @ApiProperty() count: number;

  constructor(count: number) {
    this.count = count;
  }
}
