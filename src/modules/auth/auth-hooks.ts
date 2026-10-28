import type { Logger } from '@nestjs/common';

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
