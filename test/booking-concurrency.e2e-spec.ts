import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import { serviceAppointments } from '@/database/schema';
import { signUpUser } from './support/accounts';
import {
  createBookingFixtureIds,
  deleteBookingFixtures,
  seedAdvisorService,
} from './support/booking-fixtures';
import { createE2eApp } from './support/e2e-app';
import { object, stringField } from './support/response';

const WINDOW_START = '09:00';

/**
 * AP-011 and AP-014. The repository integration spec proves the exclusion constraint
 * in isolation; this proves the behaviour Advisees actually see, through the HTTP
 * stack, the advisory lock, and the eligibility rederivation.
 */
describe('concurrent booking of one Advisor time (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const ids = createBookingFixtureIds();

  beforeAll(async () => {
    ({ app, db } = await createE2eApp());
  });

  afterEach(async () => {
    await deleteBookingFixtures(db, ids);
  });

  afterAll(async () => {
    await app.close();
  });

  const signUp = () => signUpUser(app, 'Booking', ids.userIds);

  /**
   * Both Advisees are pointed at the first slot of the seeded window, so they are
   * forced to compete for the same range.
   */
  async function seedBookableService() {
    const seeded = await seedAdvisorService({ app, db }, ids, {
      label: 'Concurrency',
    });
    return { ...seeded, startTime: seeded.slotAt(WINDOW_START) };
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
