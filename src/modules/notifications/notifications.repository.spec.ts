import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool } from 'pg';
import { runWithLocale } from '@/common/i18n/request-locale';
import type { DrizzleDB } from '@/database/database.module';
import { NotificationsRepository } from './notifications.repository';
import type { NotifyInput } from './notifications.types';

const ownerId = '11111111-1111-4111-8111-111111111111';
const roomId = '22222222-2222-4222-8222-222222222222';
const notificationId = '33333333-3333-4333-8333-333333333333';
const bookingId = '44444444-4444-4444-8444-444444444444';

const thai = {
  title: 'การจองของคุณได้รับการยืนยันแล้ว',
  content: 'ปรึกษาการเงิน · 20 ก.ย. 2569 10:00',
};
const english = {
  title: 'Your booking is confirmed',
  content: 'ปรึกษาการเงิน · 20 Sept 2026, 10:00',
};

const booking: NotifyInput = {
  ownerId,
  type: 'BOOKING_CONFIRMED',
  ...thai,
  en: english,
  resourceId: bookingId,
};

type Statement = { readonly sql: string; readonly params: readonly unknown[] };

/**
 * Stands in for Postgres under the real query builder, so what is checked is the
 * SQL the repository sends. Records every statement in order. An insert into
 * `notifications` returns `notificationId`; a read returns the notification in
 * English when the statement asks the translations for `en` and in Thai
 * otherwise, as the localized columns' coalesce does. `failOn` makes the first
 * statement containing it fail.
 */
function fakePostgres(failOn?: string) {
  const statements: Statement[] = [];
  const answer = ({ sql, params }: Statement): unknown[][] => {
    if (sql.startsWith('insert into "notifications"')) {
      return [[notificationId]];
    }
    if (sql.startsWith('select') || sql.includes(' returning ')) {
      const text =
        sql.includes('"notification_translations"') && params.includes('en')
          ? english
          : thai;
      // In the column order of the select.
      return [
        [
          notificationId,
          ownerId,
          booking.type,
          text.title,
          text.content,
          bookingId,
          false,
          '2026-10-13 08:00:00+00',
        ],
      ];
    }
    return [];
  };
  const client = {
    query: (config: { text: string }, params: unknown[] = []) => {
      const statement = { sql: config.text, params };
      statements.push(statement);
      if (failOn && config.text.includes(failOn)) {
        failOn = undefined;
        return Promise.reject(new Error('write failed'));
      }
      return Promise.resolve({ rows: answer(statement) });
    },
  };
  const db = drizzle({
    client: client as unknown as Pool,
  }) as unknown as DrizzleDB;
  return { repository: new NotificationsRepository(db), statements };
}

/** What each statement was, in order: `begin`, `insert into "notifications"`, `select`... */
const kinds = (statements: readonly Statement[]) =>
  statements.map(
    ({ sql }) =>
      /^(begin|commit|rollback|select|update "\w+"|insert into "\w+")/.exec(
        sql,
      )?.[0] ?? sql,
  );

const translationWrites = (statements: readonly Statement[]) =>
  statements
    .filter(({ sql }) =>
      sql.startsWith('insert into "notification_translations"'),
    )
    .map(({ params }) => params.slice(0, 4));

describe('NotificationsRepository languages', () => {
  it('writes a new notification and both its languages in one transaction', async () => {
    const { repository, statements } = fakePostgres();

    await repository.createWithTranslations(booking);

    expect(kinds(statements)).toEqual([
      'begin',
      'insert into "notifications"',
      'insert into "notification_translations"',
      'insert into "notification_translations"',
      'select',
      'commit',
    ]);
    expect(translationWrites(statements)).toEqual([
      [notificationId, 'th', thai.title, thai.content],
      [notificationId, 'en', english.title, english.content],
    ]);
  });

  it('keeps the Thai on the notifications row and English off it', async () => {
    const { repository, statements } = fakePostgres();

    await repository.createWithTranslations(booking);

    const [insert] = statements.filter(({ sql }) =>
      sql.startsWith('insert into "notifications"'),
    );
    expect(insert.sql).not.toMatch(/"en"/);
    expect(insert.params).toEqual([
      ownerId,
      'BOOKING_CONFIRMED',
      thai.title,
      thai.content,
      bookingId,
    ]);
  });

  it('rolls the notification back when a translation cannot be written', async () => {
    const { repository, statements } = fakePostgres(
      'insert into "notification_translations"',
    );

    await expect(repository.createWithTranslations(booking)).rejects.toThrow();
    expect(kinds(statements).at(-1)).toBe('rollback');
    expect(kinds(statements)).not.toContain('commit');
  });

  it("rewrites both languages when a chat message updates the room's unread notification", async () => {
    const { repository, statements } = fakePostgres();

    await repository.upsertUnreadMessage({
      ownerId,
      type: 'NEW_MESSAGE',
      title: 'ข้อความใหม่จาก อารยา ส.',
      content: 'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
      en: {
        title: 'New message from อารยา ส.',
        content: 'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
      },
      resourceId: roomId,
    });

    expect(kinds(statements)).toEqual([
      'begin',
      'insert into "notifications"',
      'insert into "notification_translations"',
      'insert into "notification_translations"',
      'select',
      'commit',
    ]);
    expect(statements[1].sql).toContain('on conflict');
    expect(translationWrites(statements)).toEqual([
      [
        notificationId,
        'th',
        'ข้อความใหม่จาก อารยา ส.',
        'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
      ],
      [
        notificationId,
        'en',
        'New message from อารยา ส.',
        'ขอเลื่อนเป็นวันพฤหัสได้ไหม',
      ],
    ]);
  });

  it('returns what it wrote in the language of the request', async () => {
    const { repository } = fakePostgres();

    await expect(
      runWithLocale('en', () => repository.createWithTranslations(booking)),
    ).resolves.toEqual(expect.objectContaining(english));
    await expect(repository.createWithTranslations(booking)).resolves.toEqual(
      expect.objectContaining(thai),
    );
  });

  it('reads a page in English when the request asks for English, and in Thai otherwise', async () => {
    const { repository, statements } = fakePostgres();

    const [inEnglish] = await runWithLocale('en', () =>
      repository.findPageForOwner(ownerId, 20),
    );
    const [inThai] = await repository.findPageForOwner(ownerId, 20);

    expect(inEnglish).toEqual(expect.objectContaining(english));
    expect(inThai).toEqual(expect.objectContaining(thai));
    expect(statements.map(({ params }) => params.slice(0, 2))).toEqual([
      ['en', 'en'],
      ['th', 'th'],
    ]);
    expect(statements[0].sql).toContain('from "notification_translations"');
  });

  it('marks one read and returns it in the language of the request', async () => {
    const { repository, statements } = fakePostgres();

    const row = await runWithLocale('en', () =>
      repository.markRead(notificationId, ownerId),
    );

    expect(row).toEqual(expect.objectContaining(english));
    expect(kinds(statements)).toEqual(['update "notifications"']);
    expect(statements[0].sql).toContain('from "notification_translations"');
  });
});
