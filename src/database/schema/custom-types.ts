import { customType } from 'drizzle-orm/pg-core';

/**
 * Drizzle's pg-core has no built-in `bytea` builder. Used for
 * `advisorIdentity.nationalIdEncrypted` — AES-encrypted at the application layer before
 * it ever reaches this column, per docs/ER.README.md.
 */
export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});
