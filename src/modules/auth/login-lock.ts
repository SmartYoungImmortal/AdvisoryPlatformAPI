import { createHash } from 'node:crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { z } from 'zod';
import type { DrizzleDB } from '@/database/database.module';
import { verification } from '@/database/schema';
import { AUTH_MESSAGES } from './auth.constants';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const lockState = z.object({
  failures: z.array(z.number()),
  lockedUntil: z.number().nullable(),
});
const credentials = z.object({ email: z.email() });

function identifier(body: unknown): string | null {
  const parsed = credentials.safeParse(body);
  if (!parsed.success) return null;
  return `login-lock:${createHash('sha256').update(parsed.data.email.toLowerCase()).digest('hex')}`;
}

function locked(until: number) {
  return new APIError('TOO_MANY_REQUESTS', {
    code: 'LOGIN_LOCKED',
    message: AUTH_MESSAGES.loginLocked,
    retryAfterSeconds: Math.max(1, Math.ceil((until - Date.now()) / 1000)),
  });
}

/** Uses expiring, private auth verification records; no password or email is stored here. */
export function loginLockHooks(database: DrizzleDB) {
  return {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return;
      const key = identifier(ctx.body);
      if (!key) return;
      const now = Date.now();
      const [record] = await database
        .select({ value: verification.value })
        .from(verification)
        .where(
          and(
            eq(verification.identifier, key),
            gt(verification.expiresAt, new Date(now)),
          ),
        )
        .limit(1);
      const until = record
        ? lockState.parse(JSON.parse(record.value)).lockedUntil
        : null;
      if (until && until > now) throw locked(until);
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-in/email') return;
      const key = identifier(ctx.body);
      if (!key) return;
      const result = ctx.context.returned;
      const failed =
        result instanceof APIError &&
        result.body?.code === 'INVALID_EMAIL_OR_PASSWORD';
      if (!failed) return;
      const isLocked = await database.transaction(async (tx) => {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`,
        );
        const now = Date.now();
        const [record] = await tx
          .select()
          .from(verification)
          .where(eq(verification.identifier, key))
          .limit(1);
        const previous =
          record && record.expiresAt.getTime() > now
            ? lockState.parse(JSON.parse(record.value))
            : { failures: [], lockedUntil: null };
        if ((previous.lockedUntil ?? 0) > now) return previous.lockedUntil;
        await tx.delete(verification).where(eq(verification.identifier, key));
        const failures = [
          ...previous.failures.filter((time) => time > now - WINDOW_MS),
          now,
        ];
        const lockedUntil =
          failures.length >= MAX_FAILURES ? now + WINDOW_MS : null;
        await tx.insert(verification).values({
          id: crypto.randomUUID(),
          identifier: key,
          value: JSON.stringify({ failures, lockedUntil }),
          expiresAt: new Date(lockedUntil ?? now + WINDOW_MS),
        });
        return lockedUntil;
      });
      if (isLocked)
        return Response.json(locked(isLocked).body, { status: 429 });
    }),
  };
}
