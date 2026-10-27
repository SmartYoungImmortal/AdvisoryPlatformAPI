import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, getColumns, lt, or, sql, type SQL } from 'drizzle-orm';
import { saveNotificationTranslations } from '@/common/i18n/content-translations';
import {
  notificationContent,
  notificationTitle,
} from '@/common/i18n/localized-columns';
import type { KeysetCursor } from '@/common/pagination/cursor-pagination.dto';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { notifications } from '@/database/schema';
import type { Notification, NotifyInput } from './notifications.types';

/** The transaction a notification and its translations are written in. */
type Transaction = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

/**
 * Every column of a notification, with the title and content in the request's
 * language. A function, not a constant: the language is read when the query is
 * built, so each query gets the one its request asks for.
 */
const localizedNotification = () => ({
  ...getColumns(notifications),
  title: notificationTitle(),
  content: notificationContent(),
});

/**
 * The notifications row itself: the Thai text, which is also the fallback for a
 * language with no translation row. Picked field by field so `en` never reaches
 * the insert.
 */
function sourceRow(input: NotifyInput) {
  return {
    ownerId: input.ownerId,
    type: input.type,
    title: input.title,
    content: input.content ?? null,
    resourceId: input.resourceId ?? null,
  };
}

@Injectable()
export class NotificationsRepository extends EntityRepository<
  typeof notifications
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, notifications);
  }

  /** Newest first, in the request's language. Paged with a cursor on (createdAt, id). */
  findPageForOwner(
    ownerId: string,
    limit: number,
    cursor?: KeysetCursor,
  ): Promise<Notification[]> {
    return this.db
      .select(localizedNotification())
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

  /**
   * Returns `undefined` if the notification does not belong to the owner. The
   * returned text is in the request's language, read in the same statement.
   */
  async markRead(
    id: string,
    ownerId: string,
  ): Promise<Notification | undefined> {
    const [row] = await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.ownerId, ownerId)))
      .returning(localizedNotification());
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
   * Adds a notification in Thai and English in one transaction, so it is never
   * readable in only one of them. Returned in the request's language.
   */
  createWithTranslations(input: NotifyInput): Promise<Notification> {
    return this.db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(notifications)
        .values(sourceRow(input))
        .returning({ id: notifications.id });
      return this.saveTranslationsAndRead(tx, id, input);
    });
  }

  /**
   * Adds an account's welcome in Thai and English, unless it already has one: the
   * partial unique index on the owner's WELCOME makes a second one a no-op, and
   * `undefined` is returned instead.
   */
  createWelcome(input: NotifyInput): Promise<Notification | undefined> {
    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(notifications)
        .values(sourceRow(input))
        .onConflictDoNothing({
          target: notifications.ownerId,
          where: sql`${notifications.type} = 'WELCOME'`,
        })
        .returning({ id: notifications.id });
      const created = inserted.at(0);
      if (!created) return undefined;
      return this.saveTranslationsAndRead(tx, created.id, input);
    });
  }

  /**
   * For a new chat message: if the chat room already has an unread notification, update it and move
   * it to the top instead of adding a new one. The partial unique index keeps this correct when two
   * messages arrive at the same time. Both translations are rewritten with the row, in the same
   * transaction, so the room's notification shows the latest message in either language.
   */
  upsertUnreadMessage(input: NotifyInput): Promise<Notification> {
    return this.db.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(notifications)
        .values(sourceRow(input))
        .onConflictDoUpdate({
          target: [notifications.ownerId, notifications.resourceId],
          targetWhere: sql`${notifications.type} = 'NEW_MESSAGE' AND ${notifications.isRead} = false`,
          set: {
            title: input.title,
            content: input.content ?? null,
            createdAt: sql`now()`,
          },
        })
        .returning({ id: notifications.id });
      return this.saveTranslationsAndRead(tx, id, input);
    });
  }

  /**
   * Writes both languages of a notification just written on `tx`, then reads it
   * back in the request's language; `returning()` cannot, as the translation rows
   * do not exist yet when the notification row is written.
   */
  private async saveTranslationsAndRead(
    tx: Transaction,
    id: string,
    input: NotifyInput,
  ): Promise<Notification> {
    await saveNotificationTranslations(tx, id, {
      th: { title: input.title, content: input.content ?? null },
      en: { title: input.en.title, content: input.en.content ?? null },
    });
    const [row] = await tx
      .select(localizedNotification())
      .from(notifications)
      .where(eq(notifications.id, id));
    return row;
  }

  private unreadWhere(ownerId: string): SQL {
    return and(
      eq(notifications.ownerId, ownerId),
      eq(notifications.isRead, false),
    ) as SQL;
  }
}
