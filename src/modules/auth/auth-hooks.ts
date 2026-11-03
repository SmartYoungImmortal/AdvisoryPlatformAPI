import type { Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { DrizzleDB } from '@/database/database.module';
import { account, session, user } from '@/database/schema';

/** What the rest of the API does when better-auth writes an account. */
export interface AuthHooks {
  /**
   * After an account is saved, whichever route saved it: email sign-up, a first
   * social sign-in, or an admin creating one. better-auth calls it once the
   * account's own transaction has committed.
   */
  onUserCreated?: (user: { id: string }) => Promise<unknown>;
}

/**
 * better-auth's `databaseHooks.user.create.after`. A failure is logged and goes no
 * further: the account exists by then, and sign-up must not answer with an error
 * for something that only follows it.
 */
export function afterUserCreated(
  hooks: AuthHooks,
  logger: Pick<Logger, 'error'>,
): (user: { id: string }) => Promise<void> {
  return async (user) => {
    if (!hooks.onUserCreated) return;
    try {
      await hooks.onUserCreated(user);
    } catch (error) {
      logger.error(
        `Account ${user.id} was created, but what follows its creation failed`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  };
}

/** The two reads and writes `beforeProviderAccountCreated` needs, kept apart so it can be tested without a database. */
export interface UnverifiedPasswordStore {
  /** The user's address was never verified and the user has a password. */
  hasUnverifiedPassword(userId: string): Promise<boolean>;
  /** Removes the user's password and ends every session they have, together. */
  dropPassword(userId: string): Promise<void>;
}

export function drizzleUnverifiedPasswordStore(
  db: DrizzleDB,
): UnverifiedPasswordStore {
  return {
    async hasUnverifiedPassword(userId) {
      const [row] = await db
        .select({ id: account.id })
        .from(account)
        .innerJoin(user, eq(user.id, account.userId))
        .where(
          and(
            eq(account.userId, userId),
            eq(account.providerId, 'credential'),
            eq(user.emailVerified, false),
          ),
        )
        .limit(1);
      return row !== undefined;
    },
    async dropPassword(userId) {
      await db.transaction(async (tx) => {
        await tx
          .delete(account)
          .where(
            and(
              eq(account.userId, userId),
              eq(account.providerId, 'credential'),
            ),
          );
        await tx.delete(session).where(eq(session.userId, userId));
      });
    },
  };
}

/**
 * better-auth's `databaseHooks.account.create.before`, for a provider account about
 * to be joined to a user.
 *
 * Signing in with Google as an address that already has an account links the two,
 * even when that account's address was never verified
 * (`requireLocalEmailVerified: false`). Its password, though, was never shown to
 * belong to the address's owner: anyone could have registered the address first and
 * waited. Google has now shown who owns it, so the password goes, and with it every
 * session it opened. The owner keeps the account and its history, and can set a
 * password again through "forgot password". A verified account keeps its password;
 * its owner proved the address already.
 *
 * It runs before the provider account exists and before better-auth marks the
 * address verified, so the read still says what the account was before this
 * sign-in. A failure stops the link: an account joined to Google with a stranger's
 * password still on it is worse than a sign-in to try again.
 */
export function beforeProviderAccountCreated(
  store: UnverifiedPasswordStore,
  logger: Pick<Logger, 'log'>,
): (created: { userId: string; providerId: string }) => Promise<void> {
  return async ({ userId, providerId }) => {
    if (providerId === 'credential') return;
    if (!(await store.hasUnverifiedPassword(userId))) return;
    await store.dropPassword(userId);
    logger.log(
      `Account ${userId}: ${providerId} proved the address, so its unverified password and sessions were removed`,
    );
  };
}
