import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { configureApp } from '@/app.factory';
import { AppModule } from '@/app.module';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  account,
  advisorGlobalAvailability,
  advisorProfiles,
  availabilityProfiles,
  availabilityWeeklyWindows,
  serviceAppointments,
  serviceCategories,
  services,
  session,
  user,
} from '@/database/schema';
import {
  addDays,
  dateInTimeZone,
  isoWeekday,
  zonedDateTimeToUtc,
} from '@/modules/availability/availability-time';
import { SeaweedFsStorageStub } from './stubs/seaweedfs-storage.stub';

const TIMEZONE = 'Asia/Bangkok';
const WINDOW_START = '09:00';

/**
 * AP-011 and AP-014. The repository integration spec proves the exclusion constraint
 * in isolation; this proves the behaviour Advisees actually see, through the HTTP
 * stack, the advisory lock, and the eligibility rederivation.
 */
describe('concurrent booking of one Advisor time (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const createdUserIds: string[] = [];
  const createdServiceIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdProfileIds: string[] = [];

  function object(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Expected an object response');
    }
    return value as Record<string, unknown>;
  }

  function stringField(source: Record<string, unknown>, key: string): string {
    const value = source[key];
    if (typeof value !== 'string') {
      throw new Error(`Expected ${key} to be a string`);
    }
    return value;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SeaweedFsStorageService)
      .useValue(new SeaweedFsStorageStub())
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();
    db = app.get<DrizzleDB>(DRIZZLE);
  });

  afterEach(async () => {
    for (const id of createdServiceIds.splice(0)) {
      await db
        .delete(serviceAppointments)
        .where(eq(serviceAppointments.serviceId, id));
      await db.delete(services).where(eq(services.id, id));
    }
    for (const id of createdProfileIds.splice(0)) {
      await db
        .delete(availabilityWeeklyWindows)
        .where(eq(availabilityWeeklyWindows.availabilityProfileId, id));
      await db
        .delete(availabilityProfiles)
        .where(eq(availabilityProfiles.id, id));
    }
    for (const id of createdCategoryIds.splice(0)) {
      await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
    }
    for (const id of createdUserIds.splice(0)) {
      await db
        .delete(advisorGlobalAvailability)
        .where(eq(advisorGlobalAvailability.advisorId, id));
      await db.delete(advisorProfiles).where(eq(advisorProfiles.userId, id));
      await db.delete(session).where(eq(session.userId, id));
      await db.delete(account).where(eq(account.userId, id));
      await db.delete(user).where(eq(user.id, id));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  async function signUp() {
    const agent = request.agent(app.getHttpServer());
    const response = await agent.post('/api/auth/sign-up/email').send({
      name: 'Booking E2E',
      fullName: 'Booking E2E User',
      email: `booking-${crypto.randomUUID()}@example.test`,
      password: 'E2e-test-password-123!',
      timezone: TIMEZONE,
    });
    expect(response.status).toBe(200);
    const userId = stringField(object(object(response.body).user), 'id');
    createdUserIds.push(userId);
    return { agent, userId };
  }

  /**
   * Builds an Advisor whose only bookable time is a single 09:00 slot on one future
   * weekday, so both Advisees are forced to compete for the same range.
   */
  async function seedBookableService() {
    const { agent, userId: advisorId } = await signUp();
    await agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Concurrency', bio: 'Concurrency fixture' })
      .expect(201);

    await agent
      .put('/api/v1/advisors/me/availability/global')
      .send({
        bufferMinutes: 0,
        bookingHorizonDays: 60,
        minimumBookingNoticeMinutes: 0,
      })
      .expect(200);

    // Seven days out stays inside the horizon and clear of the notice window
    // wherever the suite happens to run.
    const bookingDate = addDays(dateInTimeZone(new Date(), TIMEZONE), 7);
    const profileResponse = await agent
      .post('/api/v1/advisors/me/availability/profiles')
      .send({
        name: 'Concurrency profile',
        weeklyWindows: [
          {
            dayOfWeek: isoWeekday(bookingDate),
            startTime: WINDOW_START,
            endTime: '12:00',
          },
        ],
      })
      .expect(201);
    const profileId = stringField(
      object(object(profileResponse.body).data),
      'id',
    );
    createdProfileIds.push(profileId);

    const [category] = await db
      .insert(serviceCategories)
      .values({ name: `Concurrency category ${crypto.randomUUID()}` })
      .returning({ id: serviceCategories.id });
    createdCategoryIds.push(category.id);

    const [service] = await db
      .insert(services)
      .values({
        advisorId,
        categoryId: category.id,
        availabilityProfileId: profileId,
        name: 'Concurrency service',
        priceSatang: 150000,
        durationMinutes: 60,
        isPublished: true,
      })
      .returning({ id: services.id });
    createdServiceIds.push(service.id);

    return {
      advisorId,
      serviceId: service.id,
      bookingDate,
      startTime: zonedDateTimeToUtc(
        bookingDate,
        WINDOW_START,
        TIMEZONE,
      ).toISOString(),
    };
  }

  async function countAppointments(serviceId: string): Promise<number> {
    const rows = await db
      .select({ id: serviceAppointments.id })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.serviceId, serviceId));
    return rows.length;
  }

  it('lets exactly one of two simultaneous Advisees claim the slot', async () => {
    const { serviceId, startTime } = await seedBookableService();
    const first = await signUp();
    const second = await signUp();

    const responses = await Promise.all([
      first.agent.post('/api/v1/bookings').send({ serviceId, startTime }),
      second.agent.post('/api/v1/bookings').send({ serviceId, startTime }),
    ]);

    const created = responses.filter((response) => response.status === 201);
    const refused = responses.filter((response) => response.status !== 201);

    expect(created).toHaveLength(1);
    expect(refused).toHaveLength(1);
    // The advisory lock makes the loser rederive eligibility and find the slot gone
    // (400). The exclusion constraint (409) is the guard behind that, not the usual
    // path, so either refusal is correct as long as only one booking exists.
    expect([400, 409]).toContain(refused[0].status);
    expect(object(created[0].body).data).toMatchObject({
      state: 'PENDING_PAYMENT',
      startTime: new Date(startTime).toISOString(),
    });
    await expect(countAppointments(serviceId)).resolves.toBe(1);
  });

  it('stops advertising the slot once it is claimed', async () => {
    const { serviceId, bookingDate, startTime } = await seedBookableService();
    const advisee = await signUp();

    const before = await advisee.agent
      .get(`/api/v1/services/${serviceId}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(200);
    const offered = object(before.body).data;
    expect(Array.isArray(offered)).toBe(true);
    expect(offered).toContainEqual(
      expect.objectContaining({ startTime: new Date(startTime).toISOString() }),
    );

    await advisee.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime })
      .expect(201);

    const after = await advisee.agent
      .get(`/api/v1/services/${serviceId}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(200);
    const remaining = object(after.body).data;
    expect(remaining).not.toContainEqual(
      expect.objectContaining({ startTime: new Date(startTime).toISOString() }),
    );
  });

  it('refuses a second booking of a claimed slot by a different Advisee', async () => {
    const { serviceId, startTime } = await seedBookableService();
    const first = await signUp();
    const second = await signUp();

    await first.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime })
      .expect(201);

    const refused = await second.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime });

    expect([400, 409]).toContain(refused.status);
    await expect(countAppointments(serviceId)).resolves.toBe(1);
  });

  it('reopens the slot when a cancellation still satisfies the notice rule', async () => {
    const { serviceId, bookingDate, startTime } = await seedBookableService();
    const advisee = await signUp();

    const booked = await advisee.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime })
      .expect(201);
    const bookingId = stringField(object(object(booked.body).data), 'id');

    const cancelled = await advisee.agent
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .expect(200);
    expect(object(object(cancelled.body).data)).toMatchObject({
      state: 'CANCELLED',
      blocksAvailability: false,
    });

    const after = await advisee.agent
      .get(`/api/v1/services/${serviceId}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(200);
    expect(object(after.body).data).toContainEqual(
      expect.objectContaining({ startTime: new Date(startTime).toISOString() }),
    );
  });
});
