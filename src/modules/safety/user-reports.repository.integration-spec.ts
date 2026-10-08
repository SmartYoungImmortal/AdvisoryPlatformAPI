import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import { adminProfiles, user, userReports } from '@/database/schema';
import { UserReportsRepository } from './user-reports.repository';

/**
 * The reports queue against real Postgres: the reporter's own list, a ruling that
 * only an open report accepts, and the existence check a report's target goes
 * through before the foreign key would turn a typo into a 500.
 */
describe('UserReportsRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: UserReportsRepository;
  const reporterId = crypto.randomUUID();
  const reportedId = crypto.randomUUID();
  const adminId = crypto.randomUUID();
  const ids = [reporterId, reportedId, adminId];

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new UserReportsRepository(db);

    await db.insert(user).values(
      ids.map((id, index) => ({
        id,
        email: `${id}@user-reports.example.test`,
        displayName: ['Reporter', 'Reported', 'Admin'][index],
        fullName: 'User Reports Test',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db.insert(adminProfiles).values({ userId: adminId });
  });

  afterAll(async () => {
    await db
      .delete(userReports)
      .where(inArray(userReports.reporterUserId, [reporterId]));
    await db.delete(adminProfiles).where(eq(adminProfiles.userId, adminId));
    await db.delete(user).where(inArray(user.id, ids));
    await pool.end();
  });

  it("lists and counts the reporter's own reports", async () => {
    await db.insert(userReports).values([
      { reporterUserId: reporterId, reportedUserId: reportedId, reason: 'a' },
      { reporterUserId: reporterId, reportedUserId: reportedId, reason: 'b' },
    ]);

    const page = await repository.findManyByReporter(reporterId, {
      limit: 20,
      offset: 0,
    });

    expect(page).toHaveLength(2);
    await expect(repository.countByReporter(reporterId)).resolves.toBe(2);
    await expect(repository.countByReporter(reportedId)).resolves.toBe(0);
  });

  it('rules on an open report once, and only once', async () => {
    const [report] = await db
      .insert(userReports)
      .values({
        reporterUserId: reporterId,
        reportedUserId: reportedId,
        reason: 'spam',
      })
      .returning({ id: userReports.id });
    const ruling = {
      status: 'DISMISSED' as const,
      reviewedByAdminId: adminId,
      resolvedAt: new Date(),
    };

    await expect(
      repository.resolveIfOpen(report.id, ruling),
    ).resolves.toMatchObject({ id: report.id, status: 'DISMISSED' });
    await expect(
      repository.resolveIfOpen(report.id, ruling),
    ).resolves.toBeUndefined();
    await expect(
      repository.countForAdmin('DISMISSED'),
    ).resolves.toBeGreaterThanOrEqual(1);
  });

  it("answers the target's name, or nothing when there is no such account", async () => {
    await expect(repository.findDisplayName(reportedId)).resolves.toBe(
      'Reported',
    );
    await expect(
      repository.findDisplayName(crypto.randomUUID()),
    ).resolves.toBeUndefined();
    await expect(
      repository.isChatRoomMember(crypto.randomUUID(), reporterId),
    ).resolves.toBe(false);
  });
});
