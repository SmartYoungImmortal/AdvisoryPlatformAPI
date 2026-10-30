import type { NestExpressApplication } from '@nestjs/platform-express';
import { inArray } from 'drizzle-orm';
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
  approveAsAdvisor,
  deleteUsers,
  signUpUser,
  type SignedUpUser,
} from './support/accounts';
import type { SeaweedFsStorageStub } from './stubs/seaweedfs-storage.stub';
import { createE2eApp } from './support/e2e-app';
import { data, object, stringField } from './support/response';

describe('advisor services (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  let storage: SeaweedFsStorageStub;
  const userIds: string[] = [];
  const categoryIds: string[] = [];
  const profileIds: string[] = [];
  const serviceIds: string[] = [];

  beforeAll(async () => {
    ({ app, db, storage } = await createE2eApp());
  });

  afterEach(async () => {
    if (serviceIds.length > 0) {
      await db.delete(services).where(inArray(services.id, serviceIds));
      serviceIds.splice(0);
    }
    if (profileIds.length > 0) {
      for (const [table, column] of [
        [
          availabilityWeeklyWindows,
          availabilityWeeklyWindows.availabilityProfileId,
        ],
        [
          availabilitySpecificWindows,
          availabilitySpecificWindows.availabilityProfileId,
        ],
        [
          availabilityBlockedPeriods,
          availabilityBlockedPeriods.availabilityProfileId,
        ],
      ] as const) {
        await db.delete(table).where(inArray(column, profileIds));
      }
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

  async function createCategory(): Promise<string> {
    const [category] = await db
      .insert(serviceCategories)
      .values({ name: `Service e2e ${crypto.randomUUID()}` })
      .returning({ id: serviceCategories.id });
    categoryIds.push(category.id);
    return category.id;
  }

  async function createProfile(
    advisor: SignedUpUser,
    name: string,
  ): Promise<string> {
    const response = await advisor.agent
      .post('/api/v1/advisors/me/availability/profiles')
      .send({ name, weeklyWindows: [] })
      .expect(201);
    const profileId = stringField(data(response.body), 'id');
    profileIds.push(profileId);
    return profileId;
  }

  it('enforces the owned service lifecycle, active profile prerequisite, and publish state', async () => {
    const advisor = await createAdvisor('Service owner');
    const otherAdvisor = await createAdvisor('Other service owner');
    const advisee = await signUpUser(app, 'Service viewer', userIds);
    const categoryId = await createCategory();
    const activeProfileId = await createProfile(advisor, 'Available hours');
    const deletedProfileId = await createProfile(advisor, 'Old hours');

    const deletedProfile = await advisor.agent
      .delete(`/api/v1/advisors/me/availability/profiles/${deletedProfileId}`)
      .expect(200);
    expect(object(deletedProfile.body)).toMatchObject({ statusCode: 200 });

    const rejectedForDeletedProfile = await advisor.agent
      .post('/api/v1/advisors/me/services')
      .send({
        categoryId,
        availabilityProfileId: deletedProfileId,
        name: 'Invalid service',
        priceSatang: 10000,
        durationMinutes: 30,
      })
      .expect(400);
    expect(object(rejectedForDeletedProfile.body)).toMatchObject({
      statusCode: 400,
      data: null,
    });

    await advisee.agent.get('/api/v1/advisors/me/services').expect(403);

    const created = await advisor.agent
      .post('/api/v1/advisors/me/services')
      .send({
        categoryId,
        availabilityProfileId: activeProfileId,
        name: 'Career coaching',
        description: 'Practical planning',
        priceSatang: 150000,
        durationMinutes: 60,
        dailyConsultationLimitMinutes: 120,
      })
      .expect(201);
    expect(object(created.body)).toMatchObject({
      statusCode: 201,
      message: 'Service created',
    });
    const service = data(created.body);
    const serviceId = stringField(service, 'id');
    serviceIds.push(serviceId);
    expect(service).toMatchObject({
      advisorId: advisor.userId,
      categoryId,
      availabilityProfileId: activeProfileId,
      priceSatang: 150000,
      durationMinutes: 60,
      dailyConsultationLimitMinutes: 120,
      isPublished: false,
    });

    const list = await advisor.agent
      .get('/api/v1/advisors/me/services')
      .query({ page: 1, limit: 20 })
      .expect(200);
    expect(object(list.body)).toMatchObject({ statusCode: 200 });
    expect(data(list.body)).toMatchObject({
      items: [expect.objectContaining({ id: serviceId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const detail = await advisor.agent
      .get(`/api/v1/advisors/me/services/${serviceId}`)
      .expect(200);
    expect(data(detail.body)).toMatchObject({
      id: serviceId,
      isPublished: false,
    });

    await otherAdvisor.agent
      .get(`/api/v1/advisors/me/services/${serviceId}`)
      .expect(404);
    await otherAdvisor.agent
      .patch(`/api/v1/advisors/me/services/${serviceId}`)
      .send({ name: 'Changed by another owner' })
      .expect(404);
    await otherAdvisor.agent
      .delete(`/api/v1/advisors/me/services/${serviceId}`)
      .expect(404);

    await advisor.agent
      .patch(`/api/v1/advisors/me/services/${serviceId}`)
      .send({ isPublished: true })
      .expect(400);
    await advisor.agent
      .post('/api/v1/advisors/me/services')
      .send({
        categoryId,
        availabilityProfileId: activeProfileId,
        name: 'No image',
        priceSatang: 10000,
        durationMinutes: 30,
        isPublished: true,
      })
      .expect(400);
    const image = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1XkAAAAASUVORK5CYII=',
      'base64',
    );
    await otherAdvisor.agent
      .post(`/api/v1/advisors/me/services/${serviceId}/images`)
      .attach('file', image, {
        filename: 'service.png',
        contentType: 'image/png',
      })
      .expect(404);
    await advisor.agent
      .post(`/api/v1/advisors/me/services/${serviceId}/images`)
      .attach('file', Buffer.from('not an image'), {
        filename: 'service.png',
        contentType: 'image/png',
      })
      .expect(400);
    await advisor.agent
      .post(`/api/v1/advisors/me/services/${serviceId}/images`)
      .attach('file', image, {
        filename: 'service.png',
        contentType: 'image/png',
      })
      .expect(201);

    await advisor.agent
      .get(`/api/v1/advisors/me/services/${serviceId}/images`)
      .expect(200);
    await otherAdvisor.agent
      .get(`/api/v1/advisors/me/services/${serviceId}/images`)
      .expect(404);
    await advisor.agent
      .post(`/api/v1/advisors/me/services/${serviceId}/images`)
      .expect(400);
    await advisor.agent
      .post(`/api/v1/advisors/me/services/${serviceId}/images`)
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);
    for (let i = 1; i < 6; i++) {
      await advisor.agent
        .post(`/api/v1/advisors/me/services/${serviceId}/images`)
        .attach('file', image, {
          filename: 'service.png',
          contentType: 'image/png',
        })
        .expect(201);
    }
    expect(storage.objectCount()).toBe(6);
    await advisor.agent
      .post(`/api/v1/advisors/me/services/${serviceId}/images`)
      .attach('file', image, {
        filename: 'extra.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(storage.objectCount()).toBe(6);

    const published = await advisor.agent
      .patch(`/api/v1/advisors/me/services/${serviceId}`)
      .send({
        name: 'Updated career coaching',
        dailyConsultationLimitMinutes: 90,
        isPublished: true,
      })
      .expect(200);
    expect(data(published.body)).toMatchObject({
      id: serviceId,
      name: 'Updated career coaching',
      dailyConsultationLimitMinutes: 90,
      isPublished: true,
    });

    const publicDetail = await advisee.agent
      .get(`/api/v1/services/${serviceId}`)
      .expect(200);
    expect(data(publicDetail.body)).toMatchObject({
      id: serviceId,
      name: 'Updated career coaching',
    });
    expect(data(publicDetail.body)).not.toHaveProperty(
      'dailyConsultationLimitMinutes',
    );
    expect(data(publicDetail.body)).not.toHaveProperty('availabilityProfileId');

    const unpublished = await advisor.agent
      .patch(`/api/v1/advisors/me/services/${serviceId}`)
      .send({ isPublished: false })
      .expect(200);
    expect(data(unpublished.body)).toMatchObject({
      id: serviceId,
      isPublished: false,
    });
    await advisee.agent.get(`/api/v1/services/${serviceId}`).expect(404);

    const deleted = await advisor.agent
      .delete(`/api/v1/advisors/me/services/${serviceId}`)
      .expect(200);
    expect(storage.objectCount()).toBe(0);
    expect(object(deleted.body)).toMatchObject({ statusCode: 200 });
    expect(data(deleted.body)).toMatchObject({
      id: serviceId,
      advisorId: advisor.userId,
      isPublished: false,
    });
    await advisor.agent
      .get(`/api/v1/advisors/me/services/${serviceId}`)
      .expect(404);
  });

  it('rejects invalid service fields through the HTTP validation pipeline', async () => {
    const advisor = await createAdvisor('Invalid service owner');
    const categoryId = await createCategory();
    const profileId = await createProfile(advisor, 'Valid profile');

    await advisor.agent
      .post('/api/v1/advisors/me/services')
      .send({
        categoryId,
        availabilityProfileId: profileId,
        name: 'Bad duration',
        priceSatang: 10000,
        durationMinutes: 0,
      })
      .expect(400);
  });
});
