import type { NestExpressApplication } from '@nestjs/platform-express';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { eq, inArray } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import request from 'supertest';
import { configureApp } from '@/app.factory';
import { AppModule } from '@/app.module';
import { MinioStorageService } from '@/common/storage/minio-storage.service';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  account,
  advisorProfiles,
  serviceAppointments,
  serviceCategories,
  services,
  serviceTimeslots,
  session,
  user,
} from '@/database/schema';
import { MinioStorageStub } from './stubs/minio-storage.stub';

interface SignupResult {
  userId: string;
  cookie: string;
  displayName: string;
}

interface VideoAccessBody {
  statusCode: number;
  message: string;
  data: {
    roomName: string;
    domain: string;
    token: string;
    expiresAt: string;
  };
}

describe('appointment video access (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  let baseUrl: string;
  const userIds: string[] = [];
  const appointmentIds: string[] = [];
  const timeslotIds: string[] = [];
  const serviceIds: string[] = [];
  const categoryIds: string[] = [];
  const advisorIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MinioStorageService)
      .useValue(new MinioStorageStub())
      .compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
    db = app.get<DrizzleDB>(DRIZZLE);
  });

  afterEach(async () => {
    if (appointmentIds.length > 0) {
      await db
        .delete(serviceAppointments)
        .where(inArray(serviceAppointments.id, appointmentIds.splice(0)));
    }
    if (timeslotIds.length > 0) {
      await db
        .delete(serviceTimeslots)
        .where(inArray(serviceTimeslots.id, timeslotIds.splice(0)));
    }
    if (serviceIds.length > 0) {
      await db
        .delete(services)
        .where(inArray(services.id, serviceIds.splice(0)));
    }
    if (categoryIds.length > 0) {
      await db
        .delete(serviceCategories)
        .where(inArray(serviceCategories.id, categoryIds.splice(0)));
    }
    if (advisorIds.length > 0) {
      await db
        .delete(advisorProfiles)
        .where(inArray(advisorProfiles.userId, advisorIds.splice(0)));
    }
    for (const userId of userIds.splice(0)) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(account).where(eq(account.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  afterAll(async () => {
    await app.close();
  });

  async function signUp(displayName: string): Promise<SignupResult> {
    const response = await request(baseUrl)
      .post('/api/auth/sign-up/email')
      .send({
        name: displayName,
        fullName: `${displayName} Test`,
        email: `video-${crypto.randomUUID()}@example.test`,
        password: 'Video-test-password-123!',
        timezone: 'Asia/Bangkok',
      })
      .expect(200);
    const body: unknown = response.body;
    if (
      typeof body !== 'object' ||
      body === null ||
      !('user' in body) ||
      typeof body.user !== 'object' ||
      body.user === null ||
      !('id' in body.user) ||
      typeof body.user.id !== 'string'
    ) {
      throw new Error('Signup did not return a user id');
    }
    const setCookie: unknown = response.headers['set-cookie'];
    if (!Array.isArray(setCookie) || typeof setCookie[0] !== 'string') {
      throw new Error('Signup did not return a session cookie');
    }

    userIds.push(body.user.id);
    return {
      userId: body.user.id,
      cookie: setCookie[0].split(';', 1)[0],
      displayName,
    };
  }

  async function createAppointment(
    advisorId: string,
    adviseeId: string,
  ): Promise<string> {
    const categoryId = crypto.randomUUID();
    const serviceId = crypto.randomUUID();
    const timeslotId = crypto.randomUUID();
    const appointmentId = crypto.randomUUID();
    categoryIds.push(categoryId);
    serviceIds.push(serviceId);
    timeslotIds.push(timeslotId);
    appointmentIds.push(appointmentId);
    advisorIds.push(advisorId);

    await db.insert(advisorProfiles).values({
      userId: advisorId,
      headline: 'Video advisor',
    });
    await db.insert(serviceCategories).values({
      id: categoryId,
      name: `Video ${categoryId}`,
    });
    await db.insert(services).values({
      id: serviceId,
      advisorId,
      categoryId,
      name: 'Video consultation',
      priceSatang: 100_00,
      durationMinutes: 30,
    });
    const now = Date.now();
    await db.insert(serviceTimeslots).values({
      id: timeslotId,
      serviceId,
      startTime: new Date(now - 5 * 60_000),
      endTime: new Date(now + 25 * 60_000),
    });
    await db.insert(serviceAppointments).values({
      id: appointmentId,
      timeslotId,
      adviseeId,
      state: 'BOOKED',
    });

    return appointmentId;
  }

  it('issues room-scoped JWTs only to active appointment participants', async () => {
    const advisor = await signUp('Video Advisor');
    const advisee = await signUp('Video Advisee');
    const outsider = await signUp('Video Outsider');
    const appointmentId = await createAppointment(
      advisor.userId,
      advisee.userId,
    );
    const endpoint = `/api/v1/appointments/${appointmentId}/video-access`;

    await request(baseUrl).get(endpoint).expect(401);

    const adviseeResponse = await request(baseUrl)
      .get(endpoint)
      .set('Cookie', advisee.cookie)
      .expect(200);
    expect(adviseeResponse.headers['cache-control']).toBe('no-store');
    const adviseeBody = adviseeResponse.body as VideoAccessBody;
    expect(adviseeBody).toMatchObject({
      statusCode: 200,
      message: 'Video access granted',
      data: {
        domain: process.env.JITSI_DOMAIN,
      },
    });
    expect(typeof adviseeBody.data.token).toBe('string');
    expect(typeof adviseeBody.data.expiresAt).toBe('string');
    expect(adviseeBody.data.roomName).toMatch(/^appointment-[a-f0-9]{32}$/);

    const secret = process.env.JITSI_APP_SECRET;
    const appId = process.env.JITSI_APP_ID;
    const domain = process.env.JITSI_DOMAIN;
    if (!secret || !appId || !domain) {
      throw new Error('Jitsi test configuration is missing');
    }
    const verified = await jwtVerify(
      adviseeBody.data.token,
      new TextEncoder().encode(secret),
      {
        audience: appId,
        issuer: appId,
        subject: domain,
        algorithms: ['HS256'],
      },
    );
    expect(verified.payload).toMatchObject({
      room: adviseeBody.data.roomName,
      context: {
        user: {
          id: advisee.userId,
          name: advisee.displayName,
        },
      },
    });

    const advisorResponse = await request(baseUrl)
      .get(endpoint)
      .set('Cookie', advisor.cookie)
      .expect(200);
    const advisorBody = advisorResponse.body as VideoAccessBody;
    expect(advisorBody.data.roomName).toBe(adviseeBody.data.roomName);
    expect(advisorBody.data.token).not.toBe(adviseeBody.data.token);

    await request(baseUrl)
      .get(endpoint)
      .set('Cookie', outsider.cookie)
      .expect(404)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({
          statusCode: 404,
          message: 'Video access not found',
          data: null,
        });
      });

    await db
      .update(serviceAppointments)
      .set({ state: 'CANCELLED' })
      .where(eq(serviceAppointments.id, appointmentId));
    await request(baseUrl)
      .get(endpoint)
      .set('Cookie', advisee.cookie)
      .expect(404);
  });
});
