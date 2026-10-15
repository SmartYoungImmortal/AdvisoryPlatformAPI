import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { CompositeKeyStore } from '@/common/repositories/composite-key.store';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { pdpaConsents } from '@/database/schema';
import type { PdpaConsent } from './dtos/pdpa-consent-response.dto';

const pdpaConsentKey = {
  userId: pdpaConsents.userId,
  policyVersion: pdpaConsents.policyVersion,
} as const;

@Injectable()
export class PdpaRepository {
  private readonly consents: CompositeKeyStore<
    typeof pdpaConsents,
    typeof pdpaConsentKey
  >;

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {
    this.consents = new CompositeKeyStore(db, pdpaConsents, pdpaConsentKey);
  }

  findForUser(userId: string): Promise<PdpaConsent[]> {
    return this.db
      .select()
      .from(pdpaConsents)
      .where(eq(pdpaConsents.userId, userId))
      .orderBy(desc(pdpaConsents.consentedAt));
  }

  /**
   * Consenting again to a version already on record returns the original row rather than
   * writing a second one; only a new policy version creates one. The conflict branch
   * rewrites `policy_version` with the value it already holds because Postgres returns no
   * row from `DO NOTHING`, and `consented_at` must not move.
   */
  async recordConsent(
    userId: string,
    policyVersion: string,
  ): Promise<PdpaConsent> {
    const [consent] = await this.db
      .insert(pdpaConsents)
      .values({ userId, policyVersion })
      .onConflictDoUpdate({
        target: [pdpaConsents.userId, pdpaConsents.policyVersion],
        set: { policyVersion: sql`excluded.policy_version` },
      })
      .returning();
    return consent;
  }

  hasConsented(userId: string, policyVersion: string): Promise<boolean> {
    return this.consents.exists({ userId, policyVersion });
  }
}
