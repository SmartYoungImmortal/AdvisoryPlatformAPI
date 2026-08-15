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
  advisorIdentity,
  advisorProfiles,
  advisorSkills,
  notifications,
  serviceCategories,
  services,
  session,
  skillProofDocuments,
  skills,
  user,
  verification,
} from '../src/database/schema';

describe('authentication and authorization (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const createdUserIds: string[] = [];
  const createdSkillIds: string[] = [];
  const createdServiceIds: string[] = [];
  const createdCategoryIds: string[] = [];

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
      createdServiceIds
        .splice(0)
        .map((id) => db.delete(services).where(eq(services.id, id))),
    );
    await Promise.all(
      createdCategoryIds
        .splice(0)
        .map((id) =>
          db.delete(serviceCategories).where(eq(serviceCategories.id, id)),
        ),
    );
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

    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('reads and updates the authenticated Advisee profile', async () => {
    const { agent, email } = await signUp();

    const profile = await agent.get('/api/v1/users/me').expect(200);
    expect(object(object(profile.body).data)).toMatchObject({
      email,
      displayName: 'E2E User',
      fullName: 'E2E Test User',
      timezone: 'Asia/Bangkok',
      roles: ['ADVISEE'],
    });

    const updated = await agent
      .patch('/api/v1/users/me')
      .send({
        displayName: '  Updated User  ',
        fullName: '  Updated Test User  ',
        timezone: 'UTC',
      })
      .expect(200);
    expect(object(object(updated.body).data)).toMatchObject({
      displayName: 'Updated User',
      fullName: 'Updated Test User',
      timezone: 'UTC',
      roles: ['ADVISEE'],
    });

    await agent
      .patch('/api/v1/users/me')
      .send({ email: 'not-allowed@example.test' })
      .expect(400);
  });

  it('removes an avatar without accepting a client-provided object key', async () => {
    const { agent, userId } = await signUp();
    await db
      .update(user)
      .set({ avatarKey: `avatars/${userId}.webp` })
      .where(eq(user.id, userId));

    await agent
      .delete('/api/v1/users/me/avatar')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          message: 'Avatar removed',
          data: { avatarKey: `avatars/${userId}.webp` },
        });
      });

    const profile = await agent.get('/api/v1/users/me').expect(200);
    expect(object(object(profile.body).data)).toMatchObject({
      avatarKey: null,
    });
  });

  it('anonymizes an account and immediately revokes authentication', async () => {
    const { agent, email, userId } = await signUp();
    await agent
      .post('/api/v1/advisors/me')
      .send({ headline: 'Personal headline', bio: 'Personal biography' })
      .expect(201);

    const [skill] = await db
      .insert(skills)
      .values({ name: `Deletion skill ${crypto.randomUUID()}` })
      .returning({ id: skills.id });
    createdSkillIds.push(skill.id);
    await db
      .insert(advisorSkills)
      .values({ advisorId: userId, skillId: skill.id });
    await db.insert(skillProofDocuments).values({
      advisorId: userId,
      skillId: skill.id,
      objectKey: `proofs/${userId}.pdf`,
      originalFileName: 'personal-proof.pdf',
    });
    await db.insert(advisorIdentity).values({
      advisorId: userId,
      nationalIdHash: crypto.randomUUID(),
      verificationStatus: 'SUBMITTED',
    });
    await db.insert(notifications).values({
      ownerId: userId,
      type: 'POLICY_WARNING',
      title: 'Private notification',
    });
    await db.insert(verification).values({
      identifier: email,
      value: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const [category] = await db
      .insert(serviceCategories)
      .values({ name: `Deletion category ${crypto.randomUUID()}` })
      .returning({ id: serviceCategories.id });
    createdCategoryIds.push(category.id);
    const [service] = await db
      .insert(services)
      .values({
        advisorId: userId,
        categoryId: category.id,
        name: 'Published personal service',
        priceSatang: 10000,
        durationMinutes: 30,
        isPublished: true,
      })
      .returning({ id: services.id });
    createdServiceIds.push(service.id);

    await agent
      .delete('/api/v1/users/me')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          message: 'Account deleted',
          data: {
            id: userId,
            email,
            displayName: 'E2E User',
            fullName: 'E2E Test User',
            roles: ['ADVISEE', 'ADVISOR'],
          },
        });
      });

    await agent.get('/api/v1/users/me').expect(401);

    const [deletedUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId));
    expect(deletedUser).toMatchObject({
      email: `${userId}@deleted.invalid`,
      emailVerified: false,
      displayName: 'Deleted User',
      fullName: 'Deleted User',
      avatarKey: null,
      timezone: 'UTC',
      status: 'DELETED',
    });

    const [deletedAdvisor] = await db
      .select()
      .from(advisorProfiles)
      .where(eq(advisorProfiles.userId, userId));
    expect(deletedAdvisor).toMatchObject({
      headline: 'Deleted advisor',
      bio: null,
    });

    const [unpublishedService] = await db
      .select({ isPublished: services.isPublished })
      .from(services)
      .where(eq(services.id, service.id));
    expect(unpublishedService?.isPublished).toBe(false);

    const erasedRows = await Promise.all([
      db.select().from(account).where(eq(account.userId, userId)),
      db.select().from(session).where(eq(session.userId, userId)),
      db
        .select()
        .from(advisorIdentity)
        .where(eq(advisorIdentity.advisorId, userId)),
      db
        .select()
        .from(advisorSkills)
        .where(eq(advisorSkills.advisorId, userId)),
      db
        .select()
        .from(skillProofDocuments)
        .where(eq(skillProofDocuments.advisorId, userId)),
      db.select().from(notifications).where(eq(notifications.ownerId, userId)),
      db.select().from(verification).where(eq(verification.identifier, email)),
    ]);
    expect(erasedRows.every((rows) => rows.length === 0)).toBe(true);
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

    const roles = await agent.get('/api/v1/users/me').expect(200);
    expect(object(object(roles.body).data)).toMatchObject({
      roles: ['ADVISEE', 'ADVISOR'],
    });

    const updated = await agent
      .patch('/api/v1/advisors/me')
      .send({ headline: 'Updated operations advisor' })
      .expect(200);
    expect(object(object(updated.body).data)).toMatchObject({
      headline: 'Updated operations advisor',
      bio: 'Helping teams improve.',
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
    const adminProfile = await agent.get('/api/v1/users/me').expect(200);
    expect(object(object(adminProfile.body).data)).toMatchObject({
      roles: ['ADVISEE', 'ADMIN'],
    });
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
