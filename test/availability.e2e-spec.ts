import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq, inArray } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import {
  availabilityBlockedPeriods,
  availabilityProfiles,
  availabilitySpecificWindows,
  availabilityWeeklyWindows,
  serviceCategories,
  services,
} from '@/database/schema';
import {
  addDays,
  dateInTimeZone,
  isoWeekday,
  zonedDateTimeToUtc,
} from '@/modules/availability/availability-time';
import {
  E2E_TIMEZONE,
  approveAsAdvisor,
  deleteUsers,
  signUpUser,
  type SignedUpUser,
} from './support/accounts';
import { createE2eApp } from './support/e2e-app';
import { data, object, stringField } from './support/response';

describe('availability profiles and service slots (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const userIds: string[] = [];
  const categoryIds: string[] = [];
  const profileIds: string[] = [];
  const serviceIds: string[] = [];

  beforeAll(async () => {
    ({ app, db } = await createE2eApp());
  });

  afterEach(async () => {
    if (serviceIds.length > 0) {
      await db.delete(services).where(inArray(services.id, serviceIds));
      serviceIds.splice(0);
    }
    if (profileIds.length > 0) {
      await db
        .delete(availabilityWeeklyWindows)
        .where(
          inArray(availabilityWeeklyWindows.availabilityProfileId, profileIds),
        );
      await db
        .delete(availabilitySpecificWindows)
        .where(
          inArray(
            availabilitySpecificWindows.availabilityProfileId,
            profileIds,
          ),
        );
      await db
        .delete(availabilityBlockedPeriods)
        .where(
          inArray(availabilityBlockedPeriods.availabilityProfileId, profileIds),
        );
      await db
        .delete(availabilityProfiles)
        .where(inArray(availabilityProfiles.id, profileIds));
      profileIds.splice(0);
    }
    if (categoryIds.length > 0) {
      await db
        .delete(serviceCategories)
        .where(inArray(serviceCategories.id, categoryIds));
      categoryIds.splice(0);
    }
    await deleteUsers(db, userIds);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createAdvisor(label: string): Promise<SignedUpUser> {
    const advisor = await signUpUser(app, label, userIds);
    await approveAsAdvisor(db, advisor, { headline: `${label} profile` });
    return advisor;
  }

  it('persists global and profile settings and derives slots from weekly, specific, and blocked windows', async () => {
    const advisor = await createAdvisor('Availability owner');
    const otherAdvisor = await createAdvisor('Other availability owner');
    const advisee = await signUpUser(app, 'Availability viewer', userIds);
    const category = await db
      .insert(serviceCategories)
      .values({ name: `Availability e2e ${crypto.randomUUID()}` })
      .returning({ id: serviceCategories.id });
    categoryIds.push(category[0].id);

    const globalSettings = {
      bufferMinutes: 0,
      bookingHorizonDays: 60,
      minimumBookingNoticeMinutes: 0,
      dailyConsultationLimitMinutes: 120,
    };
    const savedGlobal = await advisor.agent
      .put('/api/v1/advisors/me/availability/global')
      .send(globalSettings)
      .expect(200);
    expect(object(savedGlobal.body)).toMatchObject({ statusCode: 200 });
    expect(data(savedGlobal.body)).toMatchObject({
      advisorId: advisor.userId,
      slotIntervalMinutes: 30,
      ...globalSettings,
    });
    const readGlobal = await advisor.agent
      .get('/api/v1/advisors/me/availability/global')
      .expect(200);
    expect(data(readGlobal.body)).toMatchObject(globalSettings);

    const bookingDate = addDays(dateInTimeZone(new Date(), E2E_TIMEZONE), 7);
    const blockedDate = addDays(bookingDate, 1);
    const profileResponse = await advisor.agent
      .post('/api/v1/advisors/me/availability/profiles')
      .send({
        name: 'Consultation hours',
        weeklyWindows: [
          {
            dayOfWeek: isoWeekday(bookingDate),
            startTime: '09:00:00',
            endTime: '12:00:00',
          },
          {
            dayOfWeek: isoWeekday(blockedDate),
            startTime: '09:00:00',
            endTime: '12:00:00',
          },
        ],
        specificWindows: [
          {
            availableDate: bookingDate,
            startTime: '13:00:00',
            endTime: '15:00:00',
          },
        ],
        blockedPeriods: [
          {
            blockedDate: bookingDate,
            startTime: '10:00:00',
            endTime: '10:30:00',
          },
          { blockedDate },
        ],
      })
      .expect(201);
    expect(object(profileResponse.body)).toMatchObject({ statusCode: 201 });
    const profile = data(profileResponse.body);
    const profileId = stringField(profile, 'id');
    profileIds.push(profileId);
    expect(profile).toMatchObject({
      advisorId: advisor.userId,
      name: 'Consultation hours',
      weeklyWindows: [
        {
          dayOfWeek: isoWeekday(bookingDate),
          startTime: '09:00:00',
          endTime: '12:00:00',
        },
        {
          dayOfWeek: isoWeekday(blockedDate),
          startTime: '09:00:00',
          endTime: '12:00:00',
        },
      ],
      specificWindows: [
        {
          availableDate: bookingDate,
          startTime: '13:00:00',
          endTime: '15:00:00',
        },
      ],
      blockedPeriods: [
        {
          blockedDate: bookingDate,
          startTime: '10:00:00',
          endTime: '10:30:00',
        },
        { blockedDate },
      ],
    });

    const profiles = await advisor.agent
      .get('/api/v1/advisors/me/availability/profiles')
      .expect(200);
    expect(object(profiles.body).data).toEqual([profile]);
    await otherAdvisor.agent
      .patch(`/api/v1/advisors/me/availability/profiles/${profileId}`)
      .send({ name: 'Someone else', weeklyWindows: [] })
      .expect(404);
    await otherAdvisor.agent
      .delete(`/api/v1/advisors/me/availability/profiles/${profileId}`)
      .expect(404);

    const [service] = await db
      .insert(services)
      .values({
        advisorId: advisor.userId,
        categoryId: category[0].id,
        availabilityProfileId: profileId,
        name: 'Availability test service',
        priceSatang: 10000,
        durationMinutes: 30,
        isPublished: true,
      })
      .returning({ id: services.id });
    serviceIds.push(service.id);

    const slotsResponse = await advisee.agent
      .get(`/api/v1/services/${service.id}/slots`)
      .query({ from: bookingDate, to: blockedDate })
      .expect(200);
    expect(object(slotsResponse.body)).toMatchObject({ statusCode: 200 });
    const slots = object(slotsResponse.body).data as Array<{
      startTime: string;
    }>;
    expect(slots.map((slot) => slot.startTime)).toEqual(
      [
        '09:00:00',
        '09:30',
        '10:30:00',
        '11:00',
        '11:30',
        '13:00:00',
        '13:30',
        '14:00',
        '14:30',
      ].map((time) =>
        zonedDateTimeToUtc(bookingDate, time, E2E_TIMEZONE).toISOString(),
      ),
    );

    const updated = await advisor.agent
      .patch(`/api/v1/advisors/me/availability/profiles/${profileId}`)
      .send({
        name: 'Specific appointment only',
        weeklyWindows: [],
        specificWindows: [
          { availableDate: bookingDate, startTime: '16:00', endTime: '17:00' },
        ],
        blockedPeriods: [],
      })
      .expect(200);
    expect(data(updated.body)).toMatchObject({
      id: profileId,
      name: 'Specific appointment only',
      weeklyWindows: [],
      specificWindows: [
        {
          availableDate: bookingDate,
          startTime: '16:00:00',
          endTime: '17:00:00',
        },
      ],
      blockedPeriods: [],
    });
    const slotsAfterUpdate = await advisee.agent
      .get(`/api/v1/services/${service.id}/slots`)
      .query({ from: bookingDate, to: bookingDate })
      .expect(200);
    expect(object(slotsAfterUpdate.body).data).toEqual(
      ['16:00', '16:30'].map((time) => {
        const startTime = zonedDateTimeToUtc(bookingDate, time, E2E_TIMEZONE);
        return {
          startTime: startTime.toISOString(),
          endTime: new Date(startTime.getTime() + 30 * 60_000).toISOString(),
        };
      }),
    );

    await advisor.agent
      .delete(`/api/v1/advisors/me/availability/profiles/${profileId}`)
      .expect(409);
    await db.delete(services).where(eq(services.id, service.id));
    serviceIds.splice(serviceIds.indexOf(service.id), 1);

    const deleted = await advisor.agent
      .delete(`/api/v1/advisors/me/availability/profiles/${profileId}`)
      .expect(200);
    expect(data(deleted.body)).toMatchObject({
      id: profileId,
      name: 'Specific appointment only',
    });
    const profilesAfterDelete = await advisor.agent
      .get('/api/v1/advisors/me/availability/profiles')
      .expect(200);
    expect(object(profilesAfterDelete.body).data).toEqual([]);
  });

  it('rejects malformed blocked-period dates and times through the HTTP API', async () => {
    const advisor = await createAdvisor('Invalid blocked period owner');
    const response = await advisor.agent
      .post('/api/v1/advisors/me/availability/profiles')
      .send({
        name: 'Bad blocked period',
        weeklyWindows: [],
        blockedPeriods: [
          {
            blockedDate: '2026-09-01T00:00:00.000Z',
            startTime: '09:00:00',
            endTime: '99:00',
          },
        ],
      })
      .expect(400);
    expect(object(response.body)).toMatchObject({
      statusCode: 400,
      data: null,
    });
  });
});
