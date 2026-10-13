import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetCursorPaginated,
  ApiGetOne,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  CursorPaginationDto,
  type CursorPaginatedResult,
} from '@/common/pagination/cursor-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { NotificationCountResponseDto } from './dtos/notification-count-response.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { NOTIFICATION_MESSAGES } from './notifications.constants';
import { NotificationsService } from './notifications.service';

/**
 * Routes for the signed-in user's notifications. Every route only reads or changes that user's own
 * notifications.
 */
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ResponseMessage(NOTIFICATION_MESSAGES.found)
  @ApiGetCursorPaginated(NotificationResponseDto)
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: CursorPaginationDto,
  ): Promise<CursorPaginatedResult<NotificationResponseDto>> {
    return this.notifications.findMine(user.id, query);
  }

  @Get('unread-count')
  @ResponseMessage(NOTIFICATION_MESSAGES.unreadCounted)
  @ApiGetOne(NotificationCountResponseDto, { name: 'Unread count' })
  countUnread(
    @CurrentUser() user: SessionUser,
  ): Promise<NotificationCountResponseDto> {
    return this.notifications.countUnread(user.id);
  }

  @Patch('read-all')
  @ResponseMessage(NOTIFICATION_MESSAGES.allRead)
  @ApiUpdate(NotificationCountResponseDto, { name: 'Notifications' })
  markAllRead(
    @CurrentUser() user: SessionUser,
  ): Promise<NotificationCountResponseDto> {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':notificationId/read')
  @ResponseMessage(NOTIFICATION_MESSAGES.read)
  @ApiUpdate(NotificationResponseDto, { name: 'Notification' })
  markRead(
    @CurrentUser() user: SessionUser,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ): Promise<NotificationResponseDto> {
    return this.notifications.markRead(user.id, notificationId);
  }
}
