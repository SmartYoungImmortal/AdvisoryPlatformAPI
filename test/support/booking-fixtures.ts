import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import {
  availabilityProfiles,
  availabilityWeeklyWindows,
  serviceAppointments,
  serviceCategories,
  services,
} from '@/database/schema';
import {
  addDays,
  dateInTimeZone,
  isoWeekday,
  zonedDateTimeToUtc,
} from '@/modules/availability/availability-time';
import { E2E_TIMEZONE, deleteUsers, signUpUser } from './accounts';
import type { SignedUpUser } from './accounts';
import type { E2eContext } from './e2e-app';
import { data, stringField } from './response';

/** Every row a booking spec creates, drained by {@link deleteBookingFixtures}. */
export interface BookingFixtureIds {
  userIds: string[];
  serviceIds: string[];
  categoryIds: string[];
  profileIds: string[];
}

export function createBookingFixtureIds(): BookingFixtureIds {
  return { userIds: [], serviceIds: [], categoryIds: [], profileIds: [] };
}

export interface SeedServiceOptions {
  label: string;
  windowStart?: string;
  windowEnd?: string;
}

export interface SeededService {
  advisor: SignedUpUser;
  serviceId: string;
  bookingDate: string;
  /** The UTC instant of `time` on the seeded booking date, as the API returns it. */
  slotAt: (time: string) => string;
}

/**
 * Publishes one Advisor, one weekly window, and one 60-minute Service whose slots
 * a spec can book. Notice and buffer are zeroed so only the window bounds matter.
 */
export async function seedAdvisorService(
  { app, db }: E2eContext,
  ids: BookingFixtureIds,
  { label, windowStart = '09:00', windowEnd = '12:00' }: SeedServiceOptions,
): Promise<SeededService> {
  const advisor = await signUpUser(app, label, ids.userIds);
  await advisor.agent
    .post('/api/v1/advisors/me')
    .send({ headline: label, bio: `${label} fixture` })
    .expect(201);
  await advisor.agent
    .put('/api/v1/advisors/me/availability/global')
    .send({
      bufferMinutes: 0,
      bookingHorizonDays: 60,
      minimumBookingNoticeMinutes: 0,
    })
    .expect(200);

  // Seven days out stays inside the horizon and clear of the notice window
  // wherever the suite happens to run.
  const bookingDate = addDays(dateInTimeZone(new Date(), E2E_TIMEZONE), 7);
  const profileResponse = await advisor.agent
    .post('/api/v1/advisors/me/availability/profiles')
    .send({
      name: `${label} profile`,
      weeklyWindows: [
        {
          dayOfWeek: isoWeekday(bookingDate),
          startTime: windowStart,
          endTime: windowEnd,
        },
      ],
    })
    .expect(201);
  const profileId = stringField(data(profileResponse.body), 'id');
  ids.profileIds.push(profileId);

  const [category] = await db
    .insert(serviceCategories)
    .values({ name: `${label} category ${crypto.randomUUID()}` })
    .returning({ id: serviceCategories.id });
  ids.categoryIds.push(category.id);

  const [service] = await db
    .insert(services)
    .values({
      advisorId: advisor.userId,
      categoryId: category.id,
      availabilityProfileId: profileId,
      name: `${label} service`,
      priceSatang: 150000,
      durationMinutes: 60,
      isPublished: true,
    })
    .returning({ id: services.id });
  ids.serviceIds.push(service.id);

  return {
    advisor,
    serviceId: service.id,
    bookingDate,
    slotAt: (time: string) =>
      zonedDateTimeToUtc(bookingDate, time, E2E_TIMEZONE).toISOString(),
  };
}

/** Deletes in dependency order: appointments before Services, windows before profiles. */
export async function deleteBookingFixtures(
  db: DrizzleDB,
  ids: BookingFixtureIds,
): Promise<void> {
  for (const id of ids.serviceIds.splice(0)) {
    await db
      .delete(serviceAppointments)
      .where(eq(serviceAppointments.serviceId, id));
    await db.delete(services).where(eq(services.id, id));
  }
  for (const id of ids.profileIds.splice(0)) {
    await db
      .delete(availabilityWeeklyWindows)
      .where(eq(availabilityWeeklyWindows.availabilityProfileId, id));
    await db
      .delete(availabilityProfiles)
      .where(eq(availabilityProfiles.id, id));
  }
  for (const id of ids.categoryIds.splice(0)) {
    await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
  }
  await deleteUsers(db, ids.userIds);
}
