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
import { UpcomingSessionResponseDto } from './dtos/upcoming-session-response.dto';
import { MEETING } from '@/modules/bookings/bookings.constants';
import {
  NOTIFICATION_MESSAGES,
  WELCOME_NOTIFICATION,
} from './notifications.constants';
import { NotificationsRepository } from './notifications.repository';
import type { DeliveryInput, NotifyInput } from './notifications.types';
import { NotificationsRealtime } from './notifications-realtime';
import { pushUrlFor } from './push/push.constants';
import { PushService } from './push/push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly push: PushService,
    private readonly realtime: NotificationsRealtime,
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

  /** One of the owner's notifications; 404 if it does not exist or belongs to someone else. */
  async findOne(
    ownerId: string,
    notificationId: string,
  ): Promise<NotificationResponseDto> {
    const row = await this.repository.findOneForOwner(notificationId, ownerId);
    if (!row) {
      throw new NotFoundException(NOTIFICATION_MESSAGES.notFound);
    }
    return new NotificationResponseDto(row);
  }

  /**
   * The caller's session that starts within the next few minutes, or is in progress; `null` when
   * there is none. "A few minutes" is when its video call opens, so the banner's join button
   * always works.
   */
  async findUpcomingSession(
    userId: string,
  ): Promise<UpcomingSessionResponseDto | null> {
    const now = new Date();
    const startsBy = new Date(
      now.getTime() + MEETING.opensMinutesBefore * 60_000,
    );
    const row = await this.repository.findUpcomingSession(
      userId,
      now,
      startsBy,
    );
    return row ? new UpcomingSessionResponseDto(row, userId) : null;
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
    this.deliver({ ...input, resourceId: row.resourceId });
    return new NotificationResponseDto(row);
  }

  /**
   * Tells the owner a notification has arrived: a live signal to their open apps
   * and a Web Push to their devices. `notify()` calls this. A feature that saves its
   * notification in its own transaction calls it after that transaction succeeds.
   *
   * Neither is awaited: the request that caused the notification must not wait on
   * them, and neither throws. The push is sent in Thai, the source language,
   * because the owner's own language is not stored anywhere.
   */
  deliver(input: DeliveryInput): void {
    this.realtime.announce(input.ownerId);
    void this.push.sendToUser(input.ownerId, {
      title: input.title,
      body: input.content ?? '',
      url: pushUrlFor(input.type),
      tag: input.resourceId ? `${input.type}:${input.resourceId}` : undefined,
    });
  }

  /**
   * Gives a new account its welcome, in Thai and English (`WELCOME_NOTIFICATION`).
   * Not pushed: an account this new has no device subscribed yet. `undefined` when
   * the account already has its welcome; there is only ever one.
   */
  async welcome(ownerId: string): Promise<NotificationResponseDto | undefined> {
    const row = await this.repository.createWelcome({
      ownerId,
      type: 'WELCOME',
      ...WELCOME_NOTIFICATION,
    });
    return row && new NotificationResponseDto(row);
  }
}
