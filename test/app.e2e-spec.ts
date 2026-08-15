import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { configureApp } from '../src/app.factory';
import { AppModule } from '../src/app.module';
import { DRIZZLE, type DrizzleDB } from '../src/database/database.module';
import {
  account,
  adminProfiles,
  advisorProfiles,
  session,
  skills,
  user,
} from '../src/database/schema';

describe('authentication and authorization (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const createdUserIds: string[] = [];
  const createdSkillIds: string[] = [];

  function object(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Expected an object response');
    }
    return value as Record<string, unknown>;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();
    db = app.get<DrizzleDB>(DRIZZLE);
  });

  afterEach(async () => {
    await Promise.all(
      createdSkillIds
        .splice(0)
        .map((id) => db.delete(skills).where(eq(skills.id, id))),
    );
    await Promise.all(
      createdUserIds.splice(0).map(async (id) => {
        await db.delete(adminProfiles).where(eq(adminProfiles.userId, id));
        await db.delete(advisorProfiles).where(eq(advisorProfiles.userId, id));
        await db.delete(session).where(eq(session.userId, id));
        await db.delete(account).where(eq(account.userId, id));
        await db.delete(user).where(eq(user.id, id));
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  async function signUp() {
    const agent = request.agent(app.getHttpServer());
    const email = `e2e-${crypto.randomUUID()}@example.test`;
    const password = 'E2e-test-password-123!';
    const response = await agent.post('/api/auth/sign-up/email').send({
      name: 'E2E User',
      fullName: 'E2E Test User',
      email,
      password,
      timezone: 'Asia/Bangkok',
      status: 'SUSPENDED',
    });

    expect(response.status).toBe(200);
    const responseBody = object(response.body);
    const responseUser = object(responseBody.user);
    const userId = responseUser.id;
    expect(userId).toEqual(expect.any(String));
    if (typeof userId !== 'string') {
      throw new Error('Signup response did not include a user id');
    }
    createdUserIds.push(userId);
    const [createdUser] = await db
      .select({ status: user.status })
      .from(user)
      .where(eq(user.id, userId));
    expect(createdUser?.status).toBe('ACTIVE');
    return { agent, email, password, userId };
  }

  it('rejects a protected route without a session', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/advisors/me')
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({ statusCode: 401, data: null });
      });
  });

  it('creates an Advisee session, upgrades once, and then permits the Advisor route', async () => {
    const { agent } = await signUp();

    await agent.get('/api/v1/advisors/me').expect(403);

    const upgraded = await agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Operations advisor', bio: 'Helping teams improve.' })
      .expect(201);
    expect(object(object(upgraded.body).data)).toMatchObject({
      headline: 'Operations advisor',
      bio: 'Helping teams improve.',
    });

    const profile = await agent.get('/api/v1/advisors/me').expect(200);
    expect(object(object(profile.body).data)).toMatchObject({
      headline: 'Operations advisor',
    });

    await agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Again' })
      .expect(409);
  });

  it('supports session lookup, sign-out, and sign-in with the same cookie agent', async () => {
    const { agent, email, password } = await signUp();

    const currentSession = await agent.get('/api/auth/get-session').expect(200);
    expect(object(currentSession.body)).toHaveProperty('user');

    await agent.post('/api/auth/sign-out').expect(200);
    await agent.get('/api/v1/advisors/me').expect(401);

    await agent
      .post('/api/auth/sign-in/email')
      .send({ email, password })
      .expect(200);
    await agent.get('/api/auth/get-session').expect(200);
    await agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Back' })
      .expect(201);
  });

  it('enforces admin-only writes and revokes access when an account is suspended', async () => {
    const { agent, userId } = await signUp();

    await agent
      .post('/api/v1/skills')
      .send({ name: 'Blocked skill' })
      .expect(403);

    await db.insert(adminProfiles).values({ userId });
    await agent.post('/api/v1/skills').send({ name: '   ' }).expect(400);
    const created = await agent
      .post('/api/v1/skills')
      .send({ name: `E2E ${crypto.randomUUID()}` })
      .expect(201);
    const createdData = object(object(created.body).data);
    const skillId = createdData.id;
    if (typeof skillId !== 'string') {
      throw new Error('Skill creation response did not include an id');
    }
    createdSkillIds.push(skillId);

    await db
      .update(user)
      .set({ status: 'SUSPENDED' })
      .where(eq(user.id, userId));
    await agent.get('/api/v1/advisors/me').expect(403);
  });
});
