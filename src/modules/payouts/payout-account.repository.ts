import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { omiseBankAccounts } from '@/database/schema';
import type { PayoutAccountRow } from './payouts.types';

/**
 * `omise_bank_accounts`: one row per Advisor, keyed on the user, naming the Omise recipient their
 * payouts go to. `bank_name` holds the bank's code (`PAYOUT_BANKS`), `account_name` the name the
 * Advisor gave; the number itself is only ever with Omise.
 */
@Injectable()
export class PayoutAccountRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findForUser(userId: string): Promise<PayoutAccountRow | undefined> {
    const [row] = await this.db
      .select()
      .from(omiseBankAccounts)
      .where(eq(omiseBankAccounts.userId, userId))
      .limit(1);
    return row;
  }

  /** Points the Advisor's row at a new recipient, or writes the row the first time. */
  async upsert(row: PayoutAccountRow): Promise<PayoutAccountRow> {
    const [saved] = await this.db
      .insert(omiseBankAccounts)
      .values(row)
      .onConflictDoUpdate({
        target: omiseBankAccounts.userId,
        set: {
          bankAccountId: row.bankAccountId,
          bankName: row.bankName,
          accountName: row.accountName,
          isDefault: row.isDefault,
        },
      })
      .returning();
    return saved;
  }

  async remove(userId: string): Promise<void> {
    await this.db
      .delete(omiseBankAccounts)
      .where(eq(omiseBankAccounts.userId, userId));
  }
}
