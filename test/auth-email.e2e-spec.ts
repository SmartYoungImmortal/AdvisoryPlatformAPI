import { createHmac } from 'node:crypto';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { configureApp } from '@/app.factory';
import { AppModule } from '@/app.module';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { user, verification } from '@/database/schema';
import { deleteUsers, signUpUser } from './support/accounts';

interface MailSummary {
  ID: string;
  Subject: string;
}

interface MailpitSearchResponse {
  messages: MailSummary[];
}

interface MailpitMessage extends MailSummary {
  Text: string;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected an object response');
  }
  return value as Record<string, unknown>;
}

function parseMailpitSearch(value: unknown): MailpitSearchResponse {
  const messages = object(value).messages;
  if (!Array.isArray(messages)) throw new Error('Missing Mailpit messages');
  return {
    messages: messages.map((message) => {
      const item = object(message);
      if (typeof item.ID !== 'string' || typeof item.Subject !== 'string') {
        throw new Error('Invalid Mailpit message summary');
      }
      return { ID: item.ID, Subject: item.Subject };
    }),
  };
}

function parseMailpitMessage(value: unknown): MailpitMessage {
  const item = object(value);
  if (
    typeof item.ID !== 'string' ||
    typeof item.Subject !== 'string' ||
    typeof item.Text !== 'string'
  ) {
    throw new Error('Invalid Mailpit message');
  }
  return { ID: item.ID, Subject: item.Subject, Text: item.Text };
}

async function waitForMessages(
  email: string,
  subject: string,
  expectedCount: number,
): Promise<MailSummary[]> {
  const mailpitUrl = process.env.MAILPIT_API_URL ?? 'http://localhost:8025';
  const url = `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Mailpit returned ${response.status}`);
    const { messages } = parseMailpitSearch(await response.json());
    const matching = messages.filter((message) => message.Subject === subject);
    if (matching.length >= expectedCount) return matching;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Mailpit did not receive ${expectedCount} ${subject} message(s)`,
  );
}

async function readMessage(id: string): Promise<MailpitMessage> {
  const mailpitUrl = process.env.MAILPIT_API_URL ?? 'http://localhost:8025';
  const response = await fetch(`${mailpitUrl}/api/v1/message/${id}`);
  if (!response.ok) throw new Error(`Mailpit returned ${response.status}`);
  return parseMailpitMessage(await response.json());
}

function makeExpiredVerificationToken(email: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET is required for e2e tests');

  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ email, iat: now - 3600, exp: now - 60 }),
  ).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

describe('authentication email delivery (e2e)', () => {
  let app: NestExpressApplication;
  let db: DrizzleDB;
  const createdUserIds: string[] = [];

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

  afterAll(async () => {
    await deleteUsers(db, createdUserIds);
    await app.close();
  });

  it('delivers and resends verification mail and rejects an expired signed link', async () => {
    const signedUp = await signUpUser(app, 'Auth email', createdUserIds);
    const verificationSubject = 'Verify your Advisory Platform email';
    const firstBatch = await waitForMessages(
      signedUp.email,
      verificationSubject,
      1,
    );
    const firstMail = await readMessage(firstBatch[0].ID);
    expect(firstMail.Text).toContain('expires in one hour');
    expect(firstMail.Text).toContain('/api/auth/verify-email?token=');

    const firstLink = new URL(
      firstMail.Text.match(/https?:\/\/[^\s]+/)?.[0] ?? '',
    );
    const token = firstLink.searchParams.get('token');
    if (!token) throw new Error('Verification email did not contain a token');
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
    ) as { exp?: unknown; iat?: unknown };
    expect(typeof payload.iat).toBe('number');
    expect(payload.exp).toBe((payload.iat as number) + 60 * 60);

    await signedUp.agent
      .post('/api/auth/send-verification-email')
      .send({ email: signedUp.email })
      .expect(200);
    const resent = await waitForMessages(
      signedUp.email,
      verificationSubject,
      2,
    );
    expect(resent).toHaveLength(2);

    await request(app.getHttpServer())
      .get(
        `/api/auth/verify-email?token=${encodeURIComponent(makeExpiredVerificationToken(signedUp.email))}&callbackURL=%2F`,
      )
      .redirects(0)
      .expect(302)
      .expect(({ headers }) => {
        expect(headers.location).toContain('error=TOKEN_EXPIRED');
      });

    const [createdUser] = await db
      .select({ emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.id, signedUp.userId));
    expect(createdUser?.emailVerified).toBe(false);
  });

  it('changes a verified email only after confirmation at the old and new addresses', async () => {
    const signedUp = await signUpUser(app, 'Email change', createdUserIds);
    const secondAccount = await signUpUser(
      app,
      'Email duplicate',
      createdUserIds,
    );
    const newEmail = `changed-${crypto.randomUUID()}@example.test`;
    const originalVerification = await waitForMessages(
      signedUp.email,
      'Verify your Advisory Platform email',
      1,
    );
    const originalVerificationMail = await readMessage(
      originalVerification[0].ID,
    );
    const originalVerificationLink = new URL(
      originalVerificationMail.Text.match(/https?:\/\/[^\s]+/)?.[0] ?? '',
    );
    await signedUp.agent
      .get(
        `${originalVerificationLink.pathname}${originalVerificationLink.search}`,
      )
      .redirects(0)
      .expect(302);

    await signedUp.agent
      .post('/api/auth/change-email')
      .send({ newEmail, callbackURL: '/account/email-updated' })
      .expect(200)
      .expect(({ body }) => expect(object(body).status).toBe(true));

    const confirmationBatch = await waitForMessages(
      signedUp.email,
      'Confirm your Advisory Platform email change',
      1,
    );
    const confirmation = await readMessage(confirmationBatch[0].ID);
    expect(confirmation.Text).toContain(newEmail);
    const confirmationLink = new URL(
      confirmation.Text.match(/https?:\/\/[^\s]+/)?.[0] ?? '',
    );
    expect(confirmationLink.pathname).toBe('/api/auth/verify-email');
    expect(confirmationLink.searchParams.get('callbackURL')).toBe(
      '/account/email-updated',
    );

    const [unchangedUser] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, signedUp.userId));
    expect(unchangedUser?.email).toBe(signedUp.email);

    await signedUp.agent
      .get(`${confirmationLink.pathname}${confirmationLink.search}`)
      .redirects(0)
      .expect(302)
      .expect(({ headers }) =>
        expect(headers.location).toBe('/account/email-updated'),
      );

    const verificationBatch = await waitForMessages(
      newEmail,
      'Verify your Advisory Platform email',
      1,
    );
    const verificationMail = await readMessage(verificationBatch[0].ID);
    const verificationLink = new URL(
      verificationMail.Text.match(/https?:\/\/[^\s]+/)?.[0] ?? '',
    );
    await signedUp.agent
      .get(`${verificationLink.pathname}${verificationLink.search}`)
      .redirects(0)
      .expect(302)
      .expect(({ headers }) =>
        expect(headers.location).toBe('/account/email-updated'),
      );

    const [changedUser] = await db
      .select({ email: user.email, emailVerified: user.emailVerified })
      .from(user)
      .where(eq(user.id, signedUp.userId));
    expect(changedUser).toEqual({ email: newEmail, emailVerified: true });

    await signedUp.agent
      .post('/api/auth/change-email')
      .send({ newEmail: secondAccount.email })
      .expect(200)
      .expect(({ body }) => expect(object(body).status).toBe(true));
    const [stillChangedUser] = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, signedUp.userId));
    expect(stillChangedUser?.email).toBe(newEmail);
  });

  it('changes a password only with the current password and the new password signs in', async () => {
    const signedUp = await signUpUser(app, 'Password change', createdUserIds);
    const newPassword = 'Changed-password-987!';
    await signedUp.agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'Wrong-current-password-123!', newPassword })
      .expect(400);

    await signedUp.agent
      .post('/api/auth/change-password')
      .send({
        currentPassword: signedUp.password,
        newPassword,
        revokeOtherSessions: true,
      })
      .expect(200);

    await request
      .agent(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: signedUp.email, password: signedUp.password })
      .expect(401);
    await request
      .agent(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: signedUp.email, password: newPassword })
      .expect(200);
  });

  it('delivers a working password reset link and rejects it after expiry', async () => {
    const signedUp = await signUpUser(app, 'Password reset', createdUserIds);
    const resetEndpoint = '/api/auth/request-password-reset';
    const resetSubject = 'Reset your Advisory Platform password';

    await request(app.getHttpServer())
      .post(resetEndpoint)
      .send({ email: signedUp.email })
      .expect(200);

    const firstBatch = await waitForMessages(signedUp.email, resetSubject, 1);
    const firstMail = await readMessage(firstBatch[0].ID);
    expect(firstMail.Text).toContain('expires in one hour');
    const firstLink = new URL(
      firstMail.Text.match(/https?:\/\/[^\s]+/)?.[0] ?? '',
    );
    const workingToken = firstLink.pathname.split('/').at(-1);
    if (!workingToken) throw new Error('Reset email did not contain a token');

    const [resetRecord] = await db
      .select({ expiresAt: verification.expiresAt })
      .from(verification)
      .where(eq(verification.identifier, `reset-password:${workingToken}`));
    expect(resetRecord).toBeDefined();
    const expiresInMs = resetRecord.expiresAt.getTime() - Date.now();
    expect(expiresInMs).toBeGreaterThan(3_500_000);
    expect(expiresInMs).toBeLessThanOrEqual(3_600_000);

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: workingToken, newPassword: 'New-password-987!' })
      .expect(200);

    await request
      .agent(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: signedUp.email, password: signedUp.password })
      .expect(401);
    await request
      .agent(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: signedUp.email, password: 'New-password-987!' })
      .expect(200);

    await request(app.getHttpServer())
      .post(resetEndpoint)
      .send({ email: signedUp.email })
      .expect(200);
    const resent = await waitForMessages(signedUp.email, resetSubject, 2);
    const latestMail = await readMessage(resent[0].ID);
    const latestLink = new URL(
      latestMail.Text.match(/https?:\/\/[^\s]+/)?.[0] ?? '',
    );
    const expiredToken = latestLink.pathname.split('/').at(-1);
    if (!expiredToken) throw new Error('Reset email did not contain a token');

    await db
      .update(verification)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(verification.identifier, `reset-password:${expiredToken}`));

    await request(app.getHttpServer())
      .get(`${latestLink.pathname}${latestLink.search}`)
      .redirects(0)
      .expect(302)
      .expect(({ headers }) => {
        expect(headers.location).toContain('error=INVALID_TOKEN');
      });

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({ token: expiredToken, newPassword: 'Another-password-987!' })
      .expect(400);
  });
});
