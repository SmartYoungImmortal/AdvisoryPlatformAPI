import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { DrizzleDB } from '@/database/database.module';
import {
  advisorProfiles,
  availabilityProfiles,
  serviceAppointments,
  serviceCategories,
  services,
  user,
} from '@/database/schema';
import { BookingsRepository } from './bookings.repository';

describe('BookingsRepository concurrency (integration)', () => {
  let pool: Pool;
  let db: DrizzleDB;
  let repository: BookingsRepository;
  let setupComplete = false;
  const advisorId = crypto.randomUUID();
  const firstAdviseeId = crypto.randomUUID();
  const secondAdviseeId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const profileId = crypto.randomUUID();
  const serviceId = crypto.randomUUID();

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool });
    repository = new BookingsRepository(db);

    await db.insert(user).values(
      [advisorId, firstAdviseeId, secondAdviseeId].map((id) => ({
        id,
        email: `${id}@booking-concurrency.example.test`,
        displayName: 'Booking constraint test',
        fullName: 'Booking Constraint Test',
        timezone: 'Asia/Bangkok',
      })),
    );
    await db
      .insert(advisorProfiles)
      .values({ userId: advisorId, headline: 'Concurrency test advisor' });
    await db
      .insert(serviceCategories)
      .values({ id: categoryId, name: 'Concurrency test category' });
    await db.insert(availabilityProfiles).values({
      id: profileId,
      advisorId,
      name: 'Concurrency test profile',
    });
    await db.insert(services).values({
      id: serviceId,
      advisorId,
      categoryId,
      availabilityProfileId: profileId,
      name: 'Concurrency test service',
      priceSatang: 10000,
      durationMinutes: 60,
      isPublished: true,
    });
    setupComplete = true;
  });

  afterAll(async () => {
    if (!setupComplete) {
      await pool?.end();
      return;
    }
    await db
      .delete(serviceAppointments)
      .where(eq(serviceAppointments.serviceId, serviceId));
    await db.delete(services).where(eq(services.id, serviceId));
    await db
      .delete(availabilityProfiles)
      .where(eq(availabilityProfiles.id, profileId));
    await db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, categoryId));
    await db
      .delete(advisorProfiles)
      .where(eq(advisorProfiles.userId, advisorId));
    for (const id of [advisorId, firstAdviseeId, secondAdviseeId]) {
      await db.delete(user).where(eq(user.id, id));
    }
    await pool.end();
  });

  it('allows exactly one of two simultaneous inserts for the same Advisor time', async () => {
    const startTime = new Date('2026-10-05T07:00:00.000Z');
    const endTime = new Date('2026-10-05T08:00:00.000Z');
    const unavailableUntil = new Date('2026-10-05T08:30:00.000Z');

    const results = await Promise.allSettled(
      [firstAdviseeId, secondAdviseeId].map((adviseeId) =>
        repository.create({
          serviceId,
          advisorId,
          adviseeId,
          startTime,
          endTime,
          unavailableUntil,
        }),
      ),
    );

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(postgresErrorCode(rejected[0].reason)).toBe('23P01');
  });
});

function postgresErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }
  return typeof error.code === 'string' ? error.code : undefined;
}
