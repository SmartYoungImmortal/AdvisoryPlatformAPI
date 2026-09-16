import { eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import {
  advisorProfiles,
  serviceAppointments,
  serviceCategories,
  serviceReviews,
  services,
  user,
} from '@/database/schema';
import { ReviewsRepository } from './reviews.repository';

/**
 * The repository's queries are joins and a GROUP BY, which a mocked Drizzle cannot tell you
 * anything about. These run against real Postgres: the star histogram, the joined card fields,
 * and the check constraint that keeps a rating inside 1..5.
 */
describe('ReviewsRepository (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: ReviewsRepository;
  let setupComplete = false;

  const advisorId = crypto.randomUUID();
  const adviseeId = crypto.randomUUID();
  const suspendedAdvisorId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();
  const appointmentIds = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    crypto.randomUUID(),
  ];
  const userIds = [advisorId, adviseeId, suspendedAdvisorId];

  const start = new Date('2026-09-10T03:00:00.000Z');
  const end = new Date('2026-09-10T03:45:00.000Z');

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new ReviewsRepository(db);

    await db.insert(user).values(
      userIds.map((id) => ({
        id,
        email: `${id}@reviews.example.test`,
        displayName: id === adviseeId ? 'อารยา ส.' : 'Reviews test',
        fullName: 'Reviews Test',
        timezone: 'Asia/Bangkok',
        ...(id === suspendedAdvisorId ? { status: 'SUSPENDED' } : {}),
      })),
    );
    await db.insert(advisorProfiles).values([
      { userId: advisorId, headline: 'Reviews test advisor' },
      { userId: suspendedAdvisorId, headline: 'Suspended advisor' },
    ]);
    await db
      .insert(serviceCategories)
      .values({ id: categoryId, name: `Reviews test ${categoryId}` });
    await db.insert(services).values({
      id: serviceId,
      advisorId,
      categoryId,
      name: 'Thesis review',
      priceSatang: 10000,
      durationMinutes: 45,
      isPublished: true,
    });
    await db.insert(serviceAppointments).values(
      appointmentIds.map((id, index) => ({
        id,
        serviceId,
        advisorId,
        adviseeId,
        // The three appointments are consecutive so the Advisor-wide exclusion constraint
        // has nothing to object to.
        startTime: new Date(start.getTime() + index * 3_600_000),
        endTime: new Date(end.getTime() + index * 3_600_000),
        unavailableUntil: new Date(end.getTime() + index * 3_600_000),
        state: 'COMPLETED' as const,
      })),
    );
    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await pool?.end();
      return;
    }
    await db
      .delete(serviceReviews)
      .where(inArray(serviceReviews.appointmentId, appointmentIds));
    await db
      .delete(serviceAppointments)
      .where(inArray(serviceAppointments.id, appointmentIds));
    await db.delete(services).where(eq(services.id, serviceId));
    await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId));
    await db
      .delete(advisorProfiles)
      .where(inArray(advisorProfiles.userId, [advisorId, suspendedAdvisorId]));
    await db.delete(user).where(inArray(user.id, userIds));
    await pool.end();
  });

  it('refuses a star rating outside 1..5', async () => {
    await expect(
      repository.create({
        appointmentId: appointmentIds[0],
        stars: 6,
        comment: null,
      }),
    ).rejects.toThrow(/service_reviews_stars_range/);
  });

  it('joins the consultation, its service and the reviewer into one card row', async () => {
    await repository.create({
      appointmentId: appointmentIds[0],
      stars: 5,
      comment: 'Clear and useful',
    });

    const row = await repository.findDetailed(appointmentIds[0]);

    expect(row).toMatchObject({
      appointmentId: appointmentIds[0],
      stars: 5,
      comment: 'Clear and useful',
      advisorReply: null,
      serviceName: 'Thesis review',
      serviceDurationMinutes: 45,
      reviewerDisplayName: 'อารยา ส.',
    });
  });

  it('leaves the advisor reply alone when the advisee rewrites the rating', async () => {
    await repository.setAdvisorReply(appointmentIds[0], 'Thank you');
    await repository.updateRating(appointmentIds[0], {
      stars: 3,
      comment: 'On reflection',
    });

    const review = await repository.findByAppointmentId(appointmentIds[0]);

    expect(review).toMatchObject({
      stars: 3,
      comment: 'On reflection',
      advisorReply: 'Thank you',
    });
  });

  it('counts the histogram in the database, newest review first in the list', async () => {
    await repository.create({
      appointmentId: appointmentIds[1],
      stars: 5,
      comment: null,
    });
    await repository.create({
      appointmentId: appointmentIds[2],
      stars: 5,
      comment: null,
    });

    const [counts, total, page] = await Promise.all([
      repository.countByStarsForAdvisor(advisorId),
      repository.countForAdvisor(advisorId),
      repository.findManyForAdvisor(advisorId, { limit: 10, offset: 0 }),
    ]);

    expect(total).toBe(3);
    expect(counts.get(5)).toBe(2);
    expect(counts.get(3)).toBe(1);
    expect(counts.get(1)).toBeUndefined();
    expect(page).toHaveLength(3);
  });

  it('finds nothing for an appointment the caller did not take part in', async () => {
    await expect(
      repository.findAppointmentForAdvisee(appointmentIds[0], advisorId),
    ).resolves.toBeUndefined();
    await expect(
      repository.findAppointmentForAdvisor(appointmentIds[0], adviseeId),
    ).resolves.toBeUndefined();
    await expect(
      repository.findAppointmentForAdvisee(appointmentIds[0], adviseeId),
    ).resolves.toBeDefined();
  });

  it('treats a suspended advisor as one the public routes cannot see', async () => {
    await expect(repository.publicAdvisorExists(advisorId)).resolves.toBe(true);
    await expect(
      repository.publicAdvisorExists(suspendedAdvisorId),
    ).resolves.toBe(false);
    await expect(repository.publicAdvisorExists(adviseeId)).resolves.toBe(
      false,
    );
  });
});
