import { ApiProperty } from '@nestjs/swagger';
import { notificationTypeEnum } from '@/database/schema';
import type {
  Notification,
  NotificationType,
} from '@/modules/notifications/notifications.types';

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: notificationTypeEnum.enumValues })
  type: NotificationType;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true, type: String }) content: string | null;
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    type: String,
    description:
      'The record to open: a screening request (SCREENING_REQUESTED), a Service ' +
      '(SCREENING_DECIDED), a chat room (NEW_MESSAGE), a booking (BOOKING_*), and so on. ' +
      "On WELCOME it is null for an Advisee's welcome (open the expert search) and the " +
      "Advisor's own user id for an Advisor's (open their profile editor).",
  })
  resourceId: string | null;
  @ApiProperty() isRead: boolean;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.type = notification.type;
    this.title = notification.title;
    this.content = notification.content;
    this.resourceId = notification.resourceId;
    this.isRead = notification.isRead;
    this.createdAt = notification.createdAt;
  }
}
