import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  type CursorPaginatedResult,
  type CursorPaginationDto,
} from '@/common/pagination/cursor-pagination.dto';
import { NotificationCountResponseDto } from './dtos/notification-count-response.dto';
import { NotificationResponseDto } from './dtos/notification-response.dto';
import { NOTIFICATION_MESSAGES } from './notifications.constants';
import { NotificationsRepository } from './notifications.repository';
import type { NotifyInput } from './notifications.types';
import { pushUrlFor } from './push/push.constants';
import { PushService } from './push/push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly push: PushService,
  ) {}

  async findMine(
    ownerId: string,
    query: CursorPaginationDto,
  ): Promise<CursorPaginatedResult<NotificationResponseDto>> {
    const cursor = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    if (query.cursor && !cursor) {
      throw new BadRequestException(NOTIFICATION_MESSAGES.invalidCursor);
    }

    const rows = await this.repository.findPageForOwner(
      ownerId,
      query.limit + 1,
      cursor,
    );
    const hasMore = rows.length > query.limit;
    const page = rows.slice(0, query.limit);
    const last = page.at(-1);

    return {
      items: page.map((row) => new NotificationResponseDto(row)),
      limit: query.limit,
      hasMore,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({ createdAt: last.createdAt, id: last.id })
          : null,
    };
  }

  async countUnread(ownerId: string): Promise<NotificationCountResponseDto> {
    return new NotificationCountResponseDto(
      await this.repository.countUnread(ownerId),
    );
  }

  async markRead(
    ownerId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    const row = await this.repository.markRead(notificationId, ownerId);
    if (!row) {
      throw new NotFoundException(NOTIFICATION_MESSAGES.notFound);
    }
    return new NotificationResponseDto(row);
  }

  async markAllRead(ownerId: string): Promise<NotificationCountResponseDto> {
    return new NotificationCountResponseDto(
      await this.repository.markAllRead(ownerId),
    );
  }

  /**
   * Creates a notification in Thai and English; other modules call this. For a new chat message
   * with a room id, the room's unread notification is updated instead of adding a new one. The
   * result is in the language of the request that caused it, not necessarily the owner's.
   */
  async notify(input: NotifyInput): Promise<NotificationResponseDto> {
    const row =
      input.type === 'NEW_MESSAGE' && input.resourceId
        ? await this.repository.upsertUnreadMessage(input)
        : await this.repository.createWithTranslations(input);
    // Not awaited: the request that caused the notification must not wait on push services.
    // `sendToUser` never rejects. Sent in Thai, the source language: the owner's own language is
    // not stored anywhere, and `row` is in the language of the request that caused it.
    void this.push.sendToUser(row.ownerId, {
      title: input.title,
      body: input.content ?? '',
      url: pushUrlFor(row.type),
      tag: row.resourceId ? `${row.type}:${row.resourceId}` : undefined,
    });
    return new NotificationResponseDto(row);
  }
}
