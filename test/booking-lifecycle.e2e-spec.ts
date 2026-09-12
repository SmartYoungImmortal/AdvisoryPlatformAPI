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
import { BookingsService } from '@/modules/bookings/bookings.service';
import { SeaweedFsStorageStub } from './stubs/seaweedfs-storage.stub';

const TIMEZONE = 'Asia/Bangkok';

/**
 * AP-009 and AP-013 through the real HTTP stack and a real database. The unit specs mock
 * the repository, so the transaction in rescheduleWithSchedulingLock, the conditional
 * transition updates, and the cancellation check constraint are only proven here.
 */
describe('booking lifecycle (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  let bookings: BookingsService;
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

  function data(body: unknown): Record<string, unknown> {
    return object(object(body).data);
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
    bookings = app.get(BookingsService);
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
      name: 'Lifecycle E2E',
      fullName: 'Lifecycle E2E User',
      email: `lifecycle-${crypto.randomUUID()}@example.test`,
      password: 'E2e-test-password-123!',
      timezone: TIMEZONE,
    });
    expect(response.status).toBe(200);
    const userId = stringField(object(object(response.body).user), 'id');
    createdUserIds.push(userId);
    return { agent, userId };
  }

  /** A 09:00-12:00 window one week out gives several 60-minute slots to move between. */
  async function seedService() {
    const advisor = await signUp();
    await advisor.agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Lifecycle', bio: 'Lifecycle fixture' })
      .expect(201);
    await advisor.agent
      .put('/api/v1/advisors/me/availability/global')
      .send({
        bufferMinutes: 0,
        bookingHorizonDays: 60,
        minimumBookingNoticeMinutes: 0,
      })
      .expect(200);

    const bookingDate = addDays(dateInTimeZone(new Date(), TIMEZONE), 7);
    const profile = await advisor.agent
      .post('/api/v1/advisors/me/availability/profiles')
      .send({
        name: 'Lifecycle profile',
        weeklyWindows: [
          {
            dayOfWeek: isoWeekday(bookingDate),
            startTime: '09:00',
            endTime: '12:00',
          },
        ],
      })
      .expect(201);
    const profileId = stringField(data(profile.body), 'id');
    createdProfileIds.push(profileId);

    const [category] = await db
      .insert(serviceCategories)
      .values({ name: `Lifecycle category ${crypto.randomUUID()}` })
      .returning({ id: serviceCategories.id });
    createdCategoryIds.push(category.id);

    const [service] = await db
      .insert(services)
      .values({
        advisorId: advisor.userId,
        categoryId: category.id,
        availabilityProfileId: profileId,
        name: 'Lifecycle service',
        priceSatang: 150000,
        durationMinutes: 60,
        isPublished: true,
      })
      .returning({ id: services.id });
    createdServiceIds.push(service.id);

    const at = (time: string) =>
      zonedDateTimeToUtc(bookingDate, time, TIMEZONE).toISOString();

    return {
      advisor,
      serviceId: service.id,
      bookingDate,
      first: at('09:00'),
      second: at('10:00'),
      third: at('11:00'),
    };
  }

  async function book(
    agent: request.Agent,
    serviceId: string,
    startTime: string,
  ) {
    const response = await agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime })
      .expect(201);
    return data(response.body);
  }

  async function readState(bookingId: string) {
    const [row] = await db
      .select()
      .from(serviceAppointments)
      .where(eq(serviceAppointments.id, bookingId));
    return row;
  }

  describe('reschedule', () => {
    it('cancels the original and claims the new time in one transaction', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      const response = await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(200);
      const replacement = data(response.body);

      expect(replacement.id).not.toBe(original.id);
      expect(replacement).toMatchObject({
        state: 'PENDING_PAYMENT',
        startTime: new Date(second).toISOString(),
      });

      const cancelled = await readState(stringField(original, 'id'));
      expect(cancelled.state).toBe('CANCELLED');
      // The cancellation check constraint requires both columns or neither.
      expect(cancelled.cancelledAt).not.toBeNull();
      expect(cancelled.cancelledByUserId).toBe(advisee.userId);
    });

    it('carries a paid booking across rather than asking the Advisee to pay twice', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);
      await bookings.confirmPayment(stringField(original, 'id'));

      const response = await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(200);

      expect(data(response.body).state).toBe('BOOKED');
    });

    it('frees the original time for another Advisee', async () => {
      const { serviceId, bookingDate, first, second } = await seedService();
      const advisee = await signUp();
      const other = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(200);

      const slots = await other.agent
        .get(`/api/v1/services/${serviceId}/slots`)
        .query({ from: bookingDate, to: bookingDate })
        .expect(200);
      expect(object(slots.body).data).toContainEqual(
        expect.objectContaining({ startTime: new Date(first).toISOString() }),
      );

      await other.agent
        .post('/api/v1/bookings')
        .send({ serviceId, startTime: first })
        .expect(201);
    });

    it('leaves the original booked when the new time is not a derived slot', async () => {
      const { serviceId, first } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: '2026-01-01T00:00:00.000Z' })
        .expect(400);

      const unchanged = await readState(stringField(original, 'id'));
      expect(unchanged.state).toBe('PENDING_PAYMENT');
      expect(unchanged.cancelledAt).toBeNull();
    });

    it('refuses to reschedule a terminal booking', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const original = await book(advisee.agent, serviceId, first);
      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/cancel`)
        .expect(200);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(409);
    });

    it('hides another Advisee booking from reschedule', async () => {
      const { serviceId, first, second } = await seedService();
      const advisee = await signUp();
      const stranger = await signUp();
      const original = await book(advisee.agent, serviceId, first);

      await stranger.agent
        .post(`/api/v1/bookings/${stringField(original, 'id')}/reschedule`)
        .send({ startTime: second })
        .expect(404);
    });
  });

  describe('advisor transitions', () => {
    it('runs a booking through to COMPLETED', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');
      await bookings.confirmPayment(bookingId);

      const started = await advisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/start`)
        .expect(200);
      expect(data(started.body).state).toBe('IN_PROGRESS');

      const completed = await advisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/complete`)
        .expect(200);
      expect(data(completed.body).state).toBe('COMPLETED');
    });

    it('refuses to start a booking that has not been paid for', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);

      await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/start`,
        )
        .expect(409);
    });

    it('refuses to complete a booking that never started', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      await bookings.confirmPayment(stringField(booking, 'id'));

      await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/complete`,
        )
        .expect(409);
    });

    it('refuses a no-show before the appointment starts', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      await bookings.confirmPayment(stringField(booking, 'id'));

      await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/no-show`,
        )
        .expect(400);
    });

    it('hides another Advisor booking from every transition', async () => {
      const { serviceId, first } = await seedService();
      const otherAdvisor = await signUp();
      await otherAdvisor.agent
        .post('/api/v1/advisors/me')
        .send({ headline: 'Other', bio: 'Other advisor' })
        .expect(201);
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');

      await otherAdvisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/start`)
        .expect(404);
      await otherAdvisor.agent
        .post(`/api/v1/advisors/me/bookings/${bookingId}/cancel`)
        .expect(404);
    });

    it('records the Advisor as the cancelling party', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);

      const cancelled = await advisor.agent
        .post(
          `/api/v1/advisors/me/bookings/${stringField(booking, 'id')}/cancel`,
        )
        .expect(200);
      expect(data(cancelled.body)).toMatchObject({
        state: 'CANCELLED',
        cancelledByUserId: advisor.userId,
      });
    });
  });

  describe('terminal states and visibility', () => {
    it('refuses a second cancellation', async () => {
      const { serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);

      await advisee.agent
        .post(`/api/v1/bookings/${stringField(booking, 'id')}/cancel`)
        .expect(200);
      await advisee.agent
        .post(`/api/v1/bookings/${stringField(booking, 'id')}/cancel`)
        .expect(409);
    });

    it('is idempotent when a payment webhook is redelivered', async () => {
      const { serviceId, first } = await seedService();
      const advisee = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');

      const once = await bookings.confirmPayment(bookingId);
      const twice = await bookings.confirmPayment(bookingId);

      expect(once.state).toBe('BOOKED');
      expect(twice.state).toBe('BOOKED');
    });

    it('shows one booking to both parties and nobody else', async () => {
      const { advisor, serviceId, first } = await seedService();
      const advisee = await signUp();
      const stranger = await signUp();
      const booking = await book(advisee.agent, serviceId, first);
      const bookingId = stringField(booking, 'id');

      await advisee.agent.get(`/api/v1/bookings/${bookingId}`).expect(200);
      await advisor.agent.get(`/api/v1/bookings/${bookingId}`).expect(200);
      await stranger.agent.get(`/api/v1/bookings/${bookingId}`).expect(404);
    });
  });
});
