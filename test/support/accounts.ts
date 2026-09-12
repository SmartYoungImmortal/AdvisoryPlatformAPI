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
 * Signs up through the real auth routes on a cookie-preserving agent. `label`
 * only distinguishes one spec's fixtures from another in the database.
 */
export async function signUpUser(
  app: NestExpressApplication,
  label: string,
  createdUserIds: string[],
): Promise<SignedUpUser> {
  const agent = request.agent(app.getHttpServer());
  const email = `${label.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomUUID()}@example.test`;
  const response = await agent.post('/api/auth/sign-up/email').send({
    name: `${label} E2E`,
    fullName: `${label} E2E User`,
    email,
    password: E2E_PASSWORD,
    timezone: E2E_TIMEZONE,
  });
  expect(response.status).toBe(200);

  const userId = stringField(object(object(response.body).user), 'id');
  createdUserIds.push(userId);
  return { agent, userId, email, password: E2E_PASSWORD };
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
