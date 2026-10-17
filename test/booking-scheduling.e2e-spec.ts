import type { NestExpressApplication } from '@nestjs/platform-express';
import type { DrizzleDB } from '@/database/database.module';
import { signUpUser } from './support/accounts';
import {
  createBookingFixtureIds,
  deleteBookingFixtures,
  seedAdvisorService,
} from './support/booking-fixtures';
import { createE2eApp } from './support/e2e-app';
import { object, stringField } from './support/response';

describe('booking scheduling contract (e2e)', () => {
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

  const signUp = () => signUpUser(app, 'Scheduling', ids.userIds);

  it('revalidates a selected time against the booking horizon', async () => {
    const { advisor, serviceId, bookingDate, slotAt } =
      await seedAdvisorService({ app, db }, ids, { label: 'Horizon' });
    const advisee = await signUp();

    await advisor.agent
      .put('/api/v1/advisors/me/availability/global')
      .send({ bookingHorizonDays: 1 })
      .expect(200);

    const slots = await advisee.agent
      .get(`/api/v1/services/${serviceId}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(200);
    expect(object(slots.body).data).toEqual([]);

    await advisee.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime: slotAt('09:00') })
      .expect(400);
  });

  it('hides remaining slots at the daily limit and rejects a stale selection', async () => {
    const { advisor, serviceId, bookingDate, slotAt } =
      await seedAdvisorService({ app, db }, ids, { label: 'Daily limit' });
    const advisee = await signUp();

    await advisor.agent
      .put('/api/v1/advisors/me/availability/global')
      .send({ dailyConsultationLimitMinutes: 60 })
      .expect(200);
    await advisee.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime: slotAt('09:00') })
      .expect(201);

    const slots = await advisee.agent
      .get(`/api/v1/services/${serviceId}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(200);
    expect(object(slots.body).data).toEqual([]);

    await advisee.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime: slotAt('10:00') })
      .expect(400);
  });

  it('does not derive a consultation across a gap between availability windows', async () => {
    const { advisor, profileId, serviceId, bookingDate } =
      await seedAdvisorService({ app, db }, ids, { label: 'Window gap' });
    const advisee = await signUp();
    const dayOfWeek = new Date(`${bookingDate}T00:00:00.000Z`).getUTCDay() || 7;

    await advisor.agent
      .patch(`/api/v1/advisors/me/availability/profiles/${profileId}`)
      .send({
        name: 'Window gap profile',
        weeklyWindows: [
          { dayOfWeek, startTime: '09:00', endTime: '10:00' },
          { dayOfWeek, startTime: '10:30', endTime: '12:00' },
        ],
      })
      .expect(200);

    const slots = await advisee.agent
      .get(`/api/v1/services/${serviceId}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(200);
    const offered = object(slots.body).data;
    expect(Array.isArray(offered)).toBe(true);
    const startTimes = (offered as Array<Record<string, unknown>>).map((slot) =>
      stringField(slot, 'startTime'),
    );
    expect(startTimes).toEqual([
      expect.stringContaining('T02:00:00.000Z'),
      expect.stringContaining('T03:30:00.000Z'),
      expect.stringContaining('T04:00:00.000Z'),
    ]);

    const invalidGapSelection = new Date(
      `${bookingDate}T09:30:00+07:00`,
    ).toISOString();
    await advisee.agent
      .post('/api/v1/bookings')
      .send({ serviceId, startTime: invalidGapSelection })
      .expect(400);
  });
});
