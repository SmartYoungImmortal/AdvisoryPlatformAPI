import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import {
  advisorProfiles,
  notifications,
  screeningAnswers,
  screeningRequests,
  serviceCategories,
  serviceScreeningQuestions,
  services,
  user,
} from '@/database/schema';
import { ScreeningRepository } from './screening.repository';

/**
 * The repository's work is transactions, joins and a partial unique index, which a mocked
 * Drizzle cannot tell you anything about. These run against real Postgres.
 */
describe('ScreeningRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: ScreeningRepository;
  let setupComplete = false;

  const advisorId = crypto.randomUUID();
  const adviseeId = crypto.randomUUID();
  const otherAdviseeId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();
  const draftServiceId = crypto.randomUUID();
  const userIds = [advisorId, adviseeId, otherAdviseeId];
  const serviceIds = [serviceId, draftServiceId];

  const notify = (ownerId: string) => ({
    ownerId,
    type: 'SCREENING_REQUESTED' as const,
    title: 'มีคำขอคัดกรองใหม่',
    content: null,
  });

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new ScreeningRepository(db);

    await db.insert(user).values(
      userIds.map((id) => ({
        id,
        email: `${id}@screening.example.test`,
        displayName: id === adviseeId ? 'ณัฐพงศ์ ด.' : 'Screening test',
        fullName: 'Screening Test',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db
      .insert(advisorProfiles)
      .values({ userId: advisorId, headline: 'Screening test advisor' });
    await db
      .insert(serviceCategories)
      .values({ id: categoryId, name: `Screening test ${categoryId}` });
    await db.insert(services).values([
      {
        id: serviceId,
        advisorId,
        categoryId,
        name: 'วางแผนภาษี',
        priceSatang: 60000,
        durationMinutes: 30,
        isPublished: true,
        screeningRequired: true,
      },
      {
        id: draftServiceId,
        advisorId,
        categoryId,
        name: 'Draft',
        priceSatang: 60000,
        durationMinutes: 30,
        isPublished: false,
        screeningRequired: true,
      },
    ]);
    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await pool?.end();
      return;
    }
    const requestIds = (
      await db
        .select({ id: screeningRequests.id })
        .from(screeningRequests)
        .where(inArray(screeningRequests.serviceId, serviceIds))
    ).map((row) => row.id);
    if (requestIds.length > 0) {
      await db
        .delete(screeningAnswers)
        .where(inArray(screeningAnswers.screeningRequestId, requestIds));
    }
    await db
      .delete(screeningRequests)
      .where(inArray(screeningRequests.serviceId, serviceIds));
    await db
      .delete(serviceScreeningQuestions)
      .where(inArray(serviceScreeningQuestions.serviceId, serviceIds));
    await db
      .delete(notifications)
      .where(inArray(notifications.ownerId, userIds));
    await db.delete(services).where(inArray(services.id, serviceIds));
    await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId));
    await db
      .delete(advisorProfiles)
      .where(eq(advisorProfiles.userId, advisorId));
    await db.delete(user).where(inArray(user.id, userIds));
    await pool.end();
  });

  it('finds published services for advisees and owned services for the advisor', async () => {
    await expect(repository.findPublishedService(serviceId)).resolves.toEqual(
      expect.objectContaining({ id: serviceId, screeningRequired: true }),
    );
    await expect(
      repository.findPublishedService(draftServiceId),
    ).resolves.toBeUndefined();
    await expect(
      repository.findOwnedService(draftServiceId, advisorId),
    ).resolves.toEqual(expect.objectContaining({ id: draftServiceId }));
    await expect(
      repository.findOwnedService(serviceId, adviseeId),
    ).resolves.toBeUndefined();
  });

  it('runs a request from submission to decision', async () => {
    const [first, second] = await repository.replaceQuestions(serviceId, [
      { question: 'คุณต้องการปรึกษาเรื่องอะไร', isRequired: true },
      { question: 'อยากได้อะไรจากการปรึกษาครั้งนี้', isRequired: false },
    ]);
    expect([first.displayOrder, second.displayOrder]).toEqual([0, 1]);

    const request = await repository.createWithAnswers(
      { serviceId, adviseeId },
      [
        { questionId: second.id, questionText: second.question, answer: 'B' },
        { questionId: first.id, questionText: first.question, answer: 'A' },
      ],
      notify(advisorId),
    );

    // A second pending request for the same pair loses to the partial unique index.
    await expect(
      repository.createWithAnswers(
        { serviceId, adviseeId },
        [{ questionId: first.id, questionText: first.question, answer: 'A' }],
        notify(advisorId),
      ),
    ).rejects.toBeDefined();

    const [row] = await repository.findManyForAdvisor(advisorId, 'PENDING', {
      limit: 10,
      offset: 0,
    });
    expect(row).toEqual(
      expect.objectContaining({
        id: request.id,
        serviceName: 'วางแผนภาษี',
        adviseeDisplayName: 'ณัฐพงศ์ ด.',
        viewedAt: null,
      }),
    );
    await expect(
      repository.countForAdvisor(advisorId, 'PENDING'),
    ).resolves.toBe(1);
    await expect(
      repository.findOneForAdvisor(request.id, adviseeId),
    ).resolves.toBeUndefined();

    // Answers come back in question order, not insertion order.
    await expect(repository.findAnswers(request.id)).resolves.toEqual([
      expect.objectContaining({ questionId: first.id, answer: 'A' }),
      expect.objectContaining({ questionId: second.id, answer: 'B' }),
    ]);

    const viewedAt = await repository.markViewed(request.id);
    await repository.markViewed(request.id);
    const [stored] = await db
      .select({ viewedAt: screeningRequests.viewedAt })
      .from(screeningRequests)
      .where(eq(screeningRequests.id, request.id));
    expect(stored.viewedAt?.getTime()).toBe(viewedAt.getTime());

    const decided = await repository.decidePending(
      request.id,
      { status: 'ACCEPTED', decidedAt: new Date() },
      { ...notify(adviseeId), type: 'SCREENING_DECIDED' },
    );
    expect(decided?.status).toBe('ACCEPTED');
    await expect(
      repository.decidePending(
        request.id,
        { status: 'DECLINED' },
        { ...notify(adviseeId), type: 'SCREENING_DECIDED' },
      ),
    ).resolves.toBeUndefined();

    const written = await db
      .select({ type: notifications.type })
      .from(notifications)
      .where(inArray(notifications.ownerId, [advisorId, adviseeId]));
    expect(written.map((n) => n.type).sort()).toEqual([
      'SCREENING_DECIDED',
      'SCREENING_REQUESTED',
    ]);
  });

  it('soft-deletes replaced questions and expires acceptances given against them', async () => {
    const before = await repository.findActiveQuestions(serviceId);
    await repository.replaceQuestions(serviceId, [
      { question: 'คำถามใหม่', isRequired: true },
    ]);

    const active = await repository.findActiveQuestions(serviceId);
    expect(active.map((q) => q.question)).toEqual(['คำถามใหม่']);

    const kept = await db
      .select({ deletedAt: serviceScreeningQuestions.deletedAt })
      .from(serviceScreeningQuestions)
      .where(
        inArray(
          serviceScreeningQuestions.id,
          before.map((q) => q.id),
        ),
      );
    expect(kept.every((q) => q.deletedAt !== null)).toBe(true);

    await expect(
      repository.findLatestForAdvisee(serviceId, adviseeId),
    ).resolves.toEqual(expect.objectContaining({ status: 'EXPIRED' }));
    await expect(
      repository.findLatestForAdvisee(serviceId, otherAdviseeId),
    ).resolves.toBeUndefined();
    await expect(repository.findDisplayName(adviseeId)).resolves.toBe(
      'ณัฐพงศ์ ด.',
    );
  });
});
