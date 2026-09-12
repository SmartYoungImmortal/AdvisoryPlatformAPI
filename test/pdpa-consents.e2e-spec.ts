import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import type { DrizzleDB } from '@/database/database.module';
import { pdpaConsents } from '@/database/schema';
import { deleteUsers, signUpUser } from './support/accounts';
import { createE2eApp } from './support/e2e-app';
import { data, object, stringField } from './support/response';

const CURRENT_POLICY = '2026-09-01';
const EARLIER_POLICY = '2026-01-01';

/**
 * The consent table is keyed (userId, policyVersion), so the behaviour worth proving is
 * against a real database: a repeated consent must not write a second row or move the
 * timestamp, and a new version must not replace the old one.
 */
describe('PDPA consents (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    ({ app, db } = await createE2eApp());
  });

  afterEach(async () => {
    await deleteUsers(db, createdUserIds);
  });

  afterAll(async () => {
    await app.close();
  });

  const signUp = () => signUpUser(app, 'PDPA', createdUserIds);

  function countRows(userId: string) {
    return db
      .select({ policyVersion: pdpaConsents.policyVersion })
      .from(pdpaConsents)
      .where(eq(pdpaConsents.userId, userId));
  }

  it('records consent for the session user', async () => {
    const { agent, userId } = await signUp();

    const response = await agent
      .post('/api/v1/pdpa-consents')
      .send({ policyVersion: CURRENT_POLICY })
      .expect(201);

    expect(data(response.body)).toMatchObject({
      userId,
      policyVersion: CURRENT_POLICY,
    });
    await expect(countRows(userId)).resolves.toHaveLength(1);
  });

  it('keeps one row and the original timestamp when the same version is sent twice', async () => {
    const { agent, userId } = await signUp();

    const first = await agent
      .post('/api/v1/pdpa-consents')
      .send({ policyVersion: CURRENT_POLICY })
      .expect(201);
    const repeated = await agent
      .post('/api/v1/pdpa-consents')
      .send({ policyVersion: CURRENT_POLICY })
      .expect(201);

    expect(stringField(data(repeated.body), 'consentedAt')).toBe(
      stringField(data(first.body), 'consentedAt'),
    );
    await expect(countRows(userId)).resolves.toHaveLength(1);
  });

  it('adds a row for a new policy version and keeps the earlier consent', async () => {
    const { agent, userId } = await signUp();

    await agent
      .post('/api/v1/pdpa-consents')
      .send({ policyVersion: EARLIER_POLICY })
      .expect(201);
    await agent
      .post('/api/v1/pdpa-consents')
      .send({ policyVersion: CURRENT_POLICY })
      .expect(201);

    const listed = await agent.get('/api/v1/pdpa-consents').expect(200);
    const versions = object(listed.body).data;
    expect(versions).toEqual([
      expect.objectContaining({ policyVersion: CURRENT_POLICY }),
      expect.objectContaining({ policyVersion: EARLIER_POLICY }),
    ]);
    await expect(countRows(userId)).resolves.toHaveLength(2);
  });

  it('rejects an empty policy version without storing anything', async () => {
    const { agent, userId } = await signUp();

    await agent
      .post('/api/v1/pdpa-consents')
      .send({ policyVersion: '   ' })
      .expect(400);

    await expect(countRows(userId)).resolves.toHaveLength(0);
  });

  it('shows an account only its own consents', async () => {
    const owner = await signUp();
    const other = await signUp();
    await owner.agent
      .post('/api/v1/pdpa-consents')
      .send({ policyVersion: CURRENT_POLICY })
      .expect(201);

    const listed = await other.agent.get('/api/v1/pdpa-consents').expect(200);

    expect(object(listed.body).data).toEqual([]);
  });

  it('requires a session', async () => {
    await request(app.getHttpServer()).get('/api/v1/pdpa-consents').expect(401);
  });
});
