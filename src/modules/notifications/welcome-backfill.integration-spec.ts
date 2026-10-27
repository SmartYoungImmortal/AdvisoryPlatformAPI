import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { and, eq, inArray, notInArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { runWithLocale } from '@/common/i18n/request-locale';
import type { DrizzleDB } from '@/database/database.module';
import {
  advisorIdentity,
  advisorProfiles,
  notifications,
  user,
} from '@/database/schema';
import { NotificationsRepository } from './notifications.repository';

/**
 * The welcome backfill migration, run again by hand against real Postgres: by the
 * time this suite runs, `db:migrate` has already applied it to an empty database.
 * Found by name rather than by its folder's timestamp, which a rebase may change.
 * Sent as one query: drizzle-kit's statement breakpoints are SQL comments.
 */
const migrationsDir = join(__dirname, '..', '..', 'database', 'migrations');
const backfillFolder = readdirSync(migrationsDir).find((name) =>
  name.endsWith('_welcome-notification-backfill'),
);
const backfillSql = readFileSync(
  join(migrationsDir, backfillFolder ?? 'missing', 'migration.sql'),
  'utf8',
);

const ADVISEE = {
  th: 'เริ่มจากหาผู้เชี่ยวชาญที่ใช่สำหรับคำถามของคุณ',
  en: 'Start by finding the right expert for your question',
};
const ADVISOR = {
  th: 'กรอกโปรไฟล์ให้ครบ เพื่อให้ผู้รับคำปรึกษาเจอคุณ',
  en: 'Complete your profile so advisees can find you',
};

describe('welcome-notification-backfill migration (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: NotificationsRepository;
  /** Welcomes that were there before this suite, which it must leave alone. */
  let earlierWelcomeIds: string[] = [];

  const adviseeId = crypto.randomUUID();
  const applicantId = crypto.randomUUID();
  const advisorId = crypto.randomUUID();
  const welcomedId = crypto.randomUUID();
  const userIds = [adviseeId, applicantId, advisorId, welcomedId];
  const advisorIds = [applicantId, advisorId];
  const adviseeCreatedAt = new Date('2026-01-02T03:04:05.000Z');

  const runBackfill = async () => {
    await pool.query(backfillSql);
  };

  const welcomesOf = (ownerId: string) =>
    db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.ownerId, ownerId),
          eq(notifications.type, 'WELCOME'),
        ),
      );

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new NotificationsRepository(db);

    earlierWelcomeIds = (
      await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(eq(notifications.type, 'WELCOME'))
    ).map(({ id }) => id);

    await db.insert(user).values(
      userIds.map((id) => ({
        id,
        email: `${id}@welcome-backfill.example.test`,
        displayName: 'Welcome backfill test',
        fullName: 'Welcome Backfill Test',
        timezone: 'Asia/Bangkok',
        ...(id === adviseeId && { createdAt: adviseeCreatedAt }),
      })),
    );
    await db
      .insert(advisorProfiles)
      .values(advisorIds.map((userId) => ({ userId, headline: 'Headline' })));
    // An applicant has a profile before an admin has looked at them; only the
    // verified one is an Advisor.
    await db.insert(advisorIdentity).values([
      { advisorId: applicantId, verificationStatus: 'SUBMITTED' },
      { advisorId, verificationStatus: 'VERIFIED' },
    ]);
    await repository.createWelcome({
      ownerId: welcomedId,
      type: 'WELCOME',
      title: 'Already welcomed',
      en: { title: 'Already welcomed' },
    });
  });

  afterAll(async () => {
    // Includes the welcomes it gave any account another suite left behind.
    await db
      .delete(notifications)
      .where(
        earlierWelcomeIds.length > 0
          ? and(
              eq(notifications.type, 'WELCOME'),
              notInArray(notifications.id, earlierWelcomeIds),
            )
          : eq(notifications.type, 'WELCOME'),
      );
    await db
      .delete(notifications)
      .where(inArray(notifications.ownerId, userIds));
    await db
      .delete(advisorIdentity)
      .where(inArray(advisorIdentity.advisorId, advisorIds));
    await db
      .delete(advisorProfiles)
      .where(inArray(advisorProfiles.userId, advisorIds));
    await db.delete(user).where(inArray(user.id, userIds));
    await pool.end();
  });

  it('is found', () => {
    expect(backfillFolder).toBeDefined();
    expect(backfillSql).toContain('INSERT INTO "notifications"');
  });

  it("gives an Advisee the welcome sign-up writes, dated at the account's creation", async () => {
    await runBackfill();

    const [welcome, ...more] = await welcomesOf(adviseeId);
    expect(more).toHaveLength(0);
    expect(welcome).toEqual(
      expect.objectContaining({
        title: 'ยินดีต้อนรับสู่ Advisory',
        content: ADVISEE.th,
        resourceId: null,
        isRead: false,
        createdAt: adviseeCreatedAt,
      }),
    );
  });

  it('treats an applicant whose identity is not verified as an Advisee', async () => {
    const [welcome] = await welcomesOf(applicantId);
    expect(welcome).toEqual(
      expect.objectContaining({ content: ADVISEE.th, resourceId: null }),
    );
  });

  it('asks a verified Advisor to finish their profile, which it points at', async () => {
    const [welcome] = await welcomesOf(advisorId);
    expect(welcome).toEqual(
      expect.objectContaining({ content: ADVISOR.th, resourceId: advisorId }),
    );
  });

  it('writes both languages', async () => {
    const [inEnglish] = await runWithLocale('en', () =>
      repository.findPageForOwner(advisorId, 20),
    );
    const [inThai] = await repository.findPageForOwner(adviseeId, 20);

    expect(inEnglish).toEqual(
      expect.objectContaining({
        title: 'Welcome to Advisory',
        content: ADVISOR.en,
      }),
    );
    expect(inThai).toEqual(
      expect.objectContaining({
        title: 'ยินดีต้อนรับสู่ Advisory',
        content: ADVISEE.th,
      }),
    );
    const [adviseeInEnglish] = await runWithLocale('en', () =>
      repository.findPageForOwner(adviseeId, 20),
    );
    expect(adviseeInEnglish.content).toBe(ADVISEE.en);
  });

  it('leaves an account that already has its welcome alone', async () => {
    const welcomes = await welcomesOf(welcomedId);
    expect(welcomes.map(({ title }) => title)).toEqual(['Already welcomed']);
  });

  it('writes nothing when run again', async () => {
    const count = async () =>
      (
        await db
          .select()
          .from(notifications)
          .where(eq(notifications.type, 'WELCOME'))
      ).length;
    const before = await count();

    await runBackfill();

    expect(await count()).toBe(before);
    const perAccount = await Promise.all(
      userIds.map(async (id) => (await welcomesOf(id)).length),
    );
    expect(perAccount).toEqual([1, 1, 1, 1]);
  });

  it('refuses a second welcome for the same account at the database', async () => {
    await expect(
      db
        .insert(notifications)
        .values({ ownerId: adviseeId, type: 'WELCOME', title: 'Again' })
        .execute(),
    ).rejects.toThrow();
    await expect(
      repository.createWelcome({
        ownerId: adviseeId,
        type: 'WELCOME',
        title: 'Again',
        en: { title: 'Again' },
      }),
    ).resolves.toBeUndefined();
  });
});
