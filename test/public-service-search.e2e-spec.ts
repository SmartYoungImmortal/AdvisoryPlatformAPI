import type { NestExpressApplication } from '@nestjs/platform-express';
import { inArray } from 'drizzle-orm';
import request from 'supertest';
import type { DrizzleDB } from '@/database/database.module';
import {
  serviceAppointments,
  serviceCategories,
  serviceReviews,
  services,
} from '@/database/schema';
import {
  approveAsAdvisor,
  deleteUsers,
  signUpUser,
  type SignedUpUser,
} from './support/accounts';
import { createE2eApp } from './support/e2e-app';
import { data, object } from './support/response';

/**
 * The public service list's rating filter and sort orders, against real reviews. Every request
 * is narrowed to a category made for this test, so other rows in the test database don't count.
 */
describe('public service search (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const userIds: string[] = [];
  let categoryId: string;
  const serviceIds: string[] = [];
  const appointmentIds: string[] = [];
  /** Service ids by the advisor's average: 4.5, 4.25 (shown as 4.3), 3.0 and no reviews. */
  const ids = { high: '', mid: '', low: '', unrated: '' };

  beforeAll(async () => {
    ({ app, db } = await createE2eApp());
    const advisee = await signUpUser(app, 'search-advisee', userIds);
    const [category] = await db
      .insert(serviceCategories)
      .values({ name: `Search e2e ${crypto.randomUUID()}` })
      .returning({ id: serviceCategories.id });
    categoryId = category.id;

    // name, price, the stars each review gives; created one day apart, high first
    const plan = [
      ['high', 50_000, [5, 4]],
      ['mid', 30_000, [5, 4, 4, 4]],
      ['low', 70_000, [3]],
      ['unrated', 40_000, []],
    ] as const;
    for (const [index, [key, priceSatang, stars]] of plan.entries()) {
      const advisor: SignedUpUser = await signUpUser(
        app,
        `search-${key}`,
        userIds,
      );
      await approveAsAdvisor(db, advisor, { headline: `${key} advisor` });
      const [service] = await db
        .insert(services)
        .values({
          advisorId: advisor.userId,
          categoryId,
          name: `Search ${key}`,
          priceSatang,
          durationMinutes: 60,
          isPublished: true,
          createdAt: new Date(Date.UTC(2031, 0, 1 + index)),
        })
        .returning({ id: services.id });
      serviceIds.push(service.id);
      ids[key] = service.id;
      for (const [n, given] of stars.entries()) {
        const start = new Date(Date.UTC(2031, 1, 1 + n, 9));
        const end = new Date(start.getTime() + 60 * 60 * 1000);
        const [appointment] = await db
          .insert(serviceAppointments)
          .values({
            serviceId: service.id,
            advisorId: advisor.userId,
            adviseeId: advisee.userId,
            startTime: start,
            endTime: end,
            unavailableUntil: end,
            state: 'COMPLETED',
            blocksAvailability: false,
          })
          .returning({ id: serviceAppointments.id });
        appointmentIds.push(appointment.id);
        await db
          .insert(serviceReviews)
          .values({ appointmentId: appointment.id, stars: given });
      }
    }
  });

  afterAll(async () => {
    if (appointmentIds.length > 0) {
      await db
        .delete(serviceReviews)
        .where(inArray(serviceReviews.appointmentId, appointmentIds));
      await db
        .delete(serviceAppointments)
        .where(inArray(serviceAppointments.id, appointmentIds));
    }
    if (serviceIds.length > 0) {
      await db.delete(services).where(inArray(services.id, serviceIds));
    }
    if (categoryId) {
      await db
        .delete(serviceCategories)
        .where(inArray(serviceCategories.id, [categoryId]));
    }
    await deleteUsers(db, userIds);
    await app.close();
  });

  async function list(params: string): Promise<string[]> {
    const response = await signedOut()
      .get(`/api/v1/services?categoryId=${categoryId}&${params}`)
      .expect(200);
    const items = data(response.body).items;
    if (!Array.isArray(items)) throw new Error('Expected a list of services');
    return items.map((item) => String(object(item).id));
  }

  function signedOut() {
    // the list is public, so no session
    return request(app.getHttpServer());
  }

  it('keeps the oldest-first order when no sort is given', async () => {
    await expect(list('')).resolves.toEqual([
      ids.high,
      ids.mid,
      ids.low,
      ids.unrated,
    ]);
  });

  it('filters on the advisor average as the rating summary rounds it', async () => {
    await expect(list('minRating=4.5')).resolves.toEqual([ids.high]);
    // 4.25 is shown as 4.3, so a 4.3 filter keeps it
    await expect(list('minRating=4.3')).resolves.toEqual([ids.high, ids.mid]);
    await expect(list('minRating=3')).resolves.toEqual([
      ids.high,
      ids.mid,
      ids.low,
    ]);
    // 0 asks for no filter, so an advisor with no reviews stays in
    await expect(list('minRating=0')).resolves.toHaveLength(4);
  });

  it('sorts by rating, with advisors who have no reviews last', async () => {
    await expect(list('sort=rating')).resolves.toEqual([
      ids.high,
      ids.mid,
      ids.low,
      ids.unrated,
    ]);
  });

  it('sorts by price both ways and by newest', async () => {
    await expect(list('sort=price_asc')).resolves.toEqual([
      ids.mid,
      ids.unrated,
      ids.high,
      ids.low,
    ]);
    await expect(list('sort=price_desc')).resolves.toEqual([
      ids.low,
      ids.high,
      ids.unrated,
      ids.mid,
    ]);
    await expect(list('sort=newest')).resolves.toEqual([
      ids.unrated,
      ids.low,
      ids.mid,
      ids.high,
    ]);
  });

  it('combines the rating filter with a sort and keeps the count true', async () => {
    const response = await signedOut()
      .get(
        `/api/v1/services?categoryId=${categoryId}&minRating=3&sort=price_asc&limit=2`,
      )
      .expect(200);
    const page = data(response.body);
    expect(page.total).toBe(3);
    expect(
      (page.items as unknown[]).map((item) => String(object(item).id)),
    ).toEqual([ids.mid, ids.high]);
  });

  it('rejects a sort or rating the list does not support', async () => {
    await signedOut().get('/api/v1/services?sort=cheapest').expect(400);
    await signedOut().get('/api/v1/services?minRating=5.5').expect(400);
    await signedOut().get('/api/v1/services?minRating=4.25').expect(400);
  });
});
