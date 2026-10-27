import { asc, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { runWithLocale } from '@/common/i18n/request-locale';
import type { DrizzleDB } from '@/database/database.module';
import {
  notificationTranslations,
  notifications,
  user,
} from '@/database/schema';
import { NotificationsRepository } from './notifications.repository';

/**
 * These tests use a real Postgres database to check paging, owner checks, the chat-message
 * upsert, and that each notification reads in the request's language.
 */
describe('NotificationsRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: NotificationsRepository;

  const ownerId = crypto.randomUUID();
  const otherId = crypto.randomUUID();
  const roomId = crypto.randomUUID();
  const userIds = [ownerId, otherId];

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new NotificationsRepository(db);

    await db.insert(user).values(
      userIds.map((id) => ({
        id,
        email: `${id}@notifications.example.test`,
        displayName: 'Notification test',
        fullName: 'Notification Test',
        timezone: 'Asia/Bangkok',
      })),
    );
  });

  afterEach(async () => {
    await db
      .delete(notifications)
      .where(inArray(notifications.ownerId, userIds));
  });

  afterAll(async () => {
    await db.delete(user).where(inArray(user.id, userIds));
    await pool.end();
  });

  const insertAt = (ownerIdValue: string, minutesAgo: number) =>
    repository.create({
      ownerId: ownerIdValue,
      type: 'BOOKING_CONFIRMED',
      title: `${minutesAgo} minutes ago`,
      createdAt: new Date(Date.now() - minutesAgo * 60_000),
    });

  /** A chat message's notification for the room, in Thai and English. */
  const message = (content: string) => ({
    ownerId,
    type: 'NEW_MESSAGE' as const,
    title: 'ข้อความใหม่จาก อารยา ส.',
    content,
    en: { title: 'New message from อารยา ส.', content },
    resourceId: roomId,
  });

  it("pages the owner's feed newest first, and only theirs", async () => {
    await insertAt(ownerId, 3);
    await insertAt(ownerId, 2);
    await insertAt(ownerId, 1);
    await insertAt(otherId, 0);

    const first = await repository.findPageForOwner(ownerId, 2);
    expect(first.map((row) => row.title)).toEqual([
      '1 minutes ago',
      '2 minutes ago',
    ]);

    const last = first[1];
    const second = await repository.findPageForOwner(ownerId, 2, {
      createdAt: last.createdAt,
      id: last.id,
    });
    expect(second.map((row) => row.title)).toEqual(['3 minutes ago']);
  });

  it('marks one or all as read, never across owners', async () => {
    const mine = await insertAt(ownerId, 2);
    await insertAt(ownerId, 1);
    const theirs = await insertAt(otherId, 1);

    expect(await repository.countUnread(ownerId)).toBe(2);
    expect(await repository.markRead(theirs.id, ownerId)).toBeUndefined();
    expect(await repository.markRead(mine.id, ownerId)).toEqual(
      expect.objectContaining({ id: mine.id, isRead: true }),
    );
    expect(await repository.countUnread(ownerId)).toBe(1);

    expect(await repository.markAllRead(ownerId)).toBe(1);
    expect(await repository.countUnread(ownerId)).toBe(0);
    expect(await repository.countUnread(otherId)).toBe(1);
  });

  it('keeps one unread notification per chat room, and starts a new one once read', async () => {
    const first = await repository.upsertUnreadMessage(message('สวัสดีครับ'));
    const second = await repository.upsertUnreadMessage(
      message('ขอเลื่อนเป็นวันพฤหัสได้ไหม'),
    );
    expect(second.id).toBe(first.id);
    expect(second.content).toBe('ขอเลื่อนเป็นวันพฤหัสได้ไหม');
    expect(second.createdAt.getTime()).toBeGreaterThanOrEqual(
      first.createdAt.getTime(),
    );

    await repository.markRead(first.id, ownerId);
    const third = await repository.upsertUnreadMessage(message('อีกข้อความ'));
    expect(third.id).not.toBe(first.id);

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.ownerId, ownerId));
    expect(rows).toHaveLength(2);
  });

  it('writes both languages and reads each notification in the one the request asks for', async () => {
    const created = await runWithLocale('en', () =>
      repository.createWithTranslations({
        ownerId,
        type: 'BOOKING_CONFIRMED',
        title: 'การจองของคุณได้รับการยืนยันแล้ว',
        content: 'ปรึกษาการเงิน · 20 ก.ย. 2569 10:00',
        en: {
          title: 'Your booking is confirmed',
          content: 'ปรึกษาการเงิน · 20 Sept 2026, 10:00',
        },
      }),
    );
    expect(created.title).toBe('Your booking is confirmed');

    const translations = await db
      .select()
      .from(notificationTranslations)
      .where(eq(notificationTranslations.notificationId, created.id))
      .orderBy(asc(notificationTranslations.locale));
    expect(translations.map((row) => [row.locale, row.title])).toEqual([
      ['th', 'การจองของคุณได้รับการยืนยันแล้ว'],
      ['en', 'Your booking is confirmed'],
    ]);

    const [inEnglish] = await runWithLocale('en', () =>
      repository.findPageForOwner(ownerId, 20),
    );
    expect(inEnglish).toEqual(
      expect.objectContaining({
        title: 'Your booking is confirmed',
        content: 'ปรึกษาการเงิน · 20 Sept 2026, 10:00',
      }),
    );
    const [inThai] = await repository.findPageForOwner(ownerId, 20);
    expect(inThai.title).toBe('การจองของคุณได้รับการยืนยันแล้ว');

    const read = await runWithLocale('en', () =>
      repository.markRead(created.id, ownerId),
    );
    expect(read?.title).toBe('Your booking is confirmed');
  });

  it('rewrites the English of a room notification with each new message', async () => {
    await repository.upsertUnreadMessage(message('สวัสดีครับ'));
    await repository.upsertUnreadMessage(message('See you Thursday'));

    const page = await runWithLocale('en', () =>
      repository.findPageForOwner(ownerId, 20),
    );
    expect(page).toHaveLength(1);
    expect(page[0]).toEqual(
      expect.objectContaining({
        title: 'New message from อารยา ส.',
        content: 'See you Thursday',
      }),
    );
  });

  it('falls back to the Thai on the row for a notification with no translations', async () => {
    await insertAt(ownerId, 1);

    const [row] = await runWithLocale('en', () =>
      repository.findPageForOwner(ownerId, 20),
    );
    expect(row.title).toBe('1 minutes ago');
  });
});
