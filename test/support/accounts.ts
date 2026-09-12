import type { NestExpressApplication } from '@nestjs/platform-express';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import type { DrizzleDB } from '@/database/database.module';
import {
  account,
  adminProfiles,
  advisorGlobalAvailability,
  advisorProfiles,
  session,
  user,
  verification,
} from '@/database/schema';
import type { E2eContext } from './e2e-app';
import { object, stringField } from './response';

export const E2E_TIMEZONE = 'Asia/Bangkok';
const E2E_PASSWORD = 'E2e-test-password-123!';

export interface SignedUpUser {
  agent: request.Agent;
  userId: string;
  email: string;
  password: string;
}

/**
 * Signs up through the real auth routes on a cookie-preserving agent. `label` only
 * distinguishes one spec's fixtures from another in the database; `overrides` adds or
 * replaces sign-up payload fields, including ones the server is expected to ignore.
 */
export async function signUpUser(
  app: NestExpressApplication,
  label: string,
  createdUserIds: string[],
  overrides: Record<string, unknown> = {},
): Promise<SignedUpUser> {
  const agent = request.agent(app.getHttpServer());
  const email = `${label.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID()}@example.test`;
  const response = await agent.post('/api/auth/sign-up/email').send({
    name: `${label} E2E`,
    fullName: `${label} E2E User`,
    email,
    password: E2E_PASSWORD,
    timezone: E2E_TIMEZONE,
    ...overrides,
  });
  expect(response.status).toBe(200);

  const userId = stringField(object(object(response.body).user), 'id');
  createdUserIds.push(userId);
  return { agent, userId, email, password: E2E_PASSWORD };
}

/**
 * Signs up and proves the server, not the client, owns the account status: whatever
 * the payload asked for, the row lands ACTIVE.
 */
export async function signUpActiveUser(
  { app, db }: E2eContext,
  label: string,
  createdUserIds: string[],
  overrides: Record<string, unknown> = {},
): Promise<SignedUpUser> {
  const signedUp = await signUpUser(app, label, createdUserIds, overrides);
  const [createdUser] = await db
    .select({ status: user.status })
    .from(user)
    .where(eq(user.id, signedUp.userId));
  expect(createdUser?.status).toBe('ACTIVE');
  return signedUp;
}

/**
 * Drains `userIds`, removing each account and the profile, session, and verification
 * rows that reference it. Specs that create none of those are unaffected.
 */
export async function deleteUsers(
  db: DrizzleDB,
  userIds: string[],
): Promise<void> {
  for (const id of userIds.splice(0)) {
    await db.delete(adminProfiles).where(eq(adminProfiles.userId, id));
    await db
      .delete(advisorGlobalAvailability)
      .where(eq(advisorGlobalAvailability.advisorId, id));
    await db.delete(advisorProfiles).where(eq(advisorProfiles.userId, id));
    await db.delete(session).where(eq(session.userId, id));
    await db.delete(account).where(eq(account.userId, id));
    await db.delete(verification).where(eq(verification.value, id));
    await db.delete(user).where(eq(user.id, id));
  }
}
