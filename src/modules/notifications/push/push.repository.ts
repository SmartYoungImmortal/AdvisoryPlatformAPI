import { Inject, Injectable } from '@nestjs/common';
import { and, eq, type InferSelectModel } from 'drizzle-orm';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { pushSubscriptions } from '@/database/schema';

export type PushSubscriptionRow = InferSelectModel<typeof pushSubscriptions>;

export interface PushSubscriptionValues {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}

@Injectable()
export class PushRepository extends EntityRepository<typeof pushSubscriptions> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, pushSubscriptions);
  }

  /** The endpoint is unique: a device that signs in as someone else takes the row over. */
  async upsert(values: PushSubscriptionValues): Promise<PushSubscriptionRow> {
    const [row] = await this.db
      .insert(pushSubscriptions)
      .values(values)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: values.userId,
          p256dh: values.p256dh,
          auth: values.auth,
          userAgent: values.userAgent,
        },
      })
      .returning();
    return row;
  }

  findByUser(userId: string): Promise<PushSubscriptionRow[]> {
    return this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  /** Returns `undefined` if the endpoint is not this user's. */
  async deleteForUser(
    userId: string,
    endpoint: string,
  ): Promise<PushSubscriptionRow | undefined> {
    const [row] = await this.db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          eq(pushSubscriptions.endpoint, endpoint),
        ),
      )
      .returning();
    return row;
  }

  /** For a push service that said the subscription is gone (404/410). */
  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }
}
