import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lt, or, sql, type SQL } from 'drizzle-orm';
import type { KeysetCursor } from '@/common/pagination/cursor-pagination.dto';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { notifications } from '@/database/schema';
import type { Notification, NotifyInput } from './notifications.types';

@Injectable()
export class NotificationsRepository extends EntityRepository<
  typeof notifications
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, notifications);
  }

  /** Newest first, keyset-paged on (createdAt, id). */
  findPageForOwner(
    ownerId: string,
    limit: number,
    cursor?: KeysetCursor,
  ): Promise<Notification[]> {
    return this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.ownerId, ownerId),
          cursor
            ? or(
                lt(notifications.createdAt, cursor.createdAt),
                and(
                  eq(notifications.createdAt, cursor.createdAt),
                  lt(notifications.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit);
  }

  countUnread(ownerId: string): Promise<number> {
    return this.count(this.unreadWhere(ownerId));
  }

  /** `undefined` when the notification is not the owner's. */
  async markRead(
    id: string,
    ownerId: string,
  ): Promise<Notification | undefined> {
    const [row] = await this.updateWhere(
      and(eq(notifications.id, id), eq(notifications.ownerId, ownerId)) as SQL,
      { isRead: true },
    );
    return row;
  }

  /** Returns how many notifications changed. */
  async markAllRead(ownerId: string): Promise<number> {
    const rows = await this.updateWhere(this.unreadWhere(ownerId), {
      isRead: true,
    });
    return rows.length;
  }

  /**
   * A new chat message refreshes the conversation's unread notification instead of adding
   * another, and moves it to the top. The partial unique index makes this safe under concurrent
   * messages.
   */
  async upsertUnreadMessage(values: NotifyInput): Promise<Notification> {
    const [row] = await this.db
      .insert(notifications)
      .values(values)
      .onConflictDoUpdate({
        target: [notifications.ownerId, notifications.resourceId],
        targetWhere: sql`${notifications.type} = 'NEW_MESSAGE' AND ${notifications.isRead} = false`,
        set: {
          title: values.title,
          content: values.content ?? null,
          createdAt: sql`now()`,
        },
      })
      .returning();
    return row;
  }

  private unreadWhere(ownerId: string): SQL {
    return and(
      eq(notifications.ownerId, ownerId),
      eq(notifications.isRead, false),
    ) as SQL;
  }
}
