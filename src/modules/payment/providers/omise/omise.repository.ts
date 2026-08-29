import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  omiseCards as omiseCardsSchema,
  omiseCustomers as omiseCustomersSchema,
} from '@/database/schema';
import { eq } from 'drizzle-orm';
import { CardId, CustomerId } from '@/modules/payment/providers/omise/types';

type OmiseCustomer = typeof omiseCustomersSchema.$inferSelect;
type OmiseCard = typeof omiseCardsSchema.$inferSelect;

@Injectable()
export class OmiseRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async recordOmiseCustomer(
    userId: string,
    omiseCustomerId: CustomerId,
  ): Promise<OmiseCustomer> {
    const omiseCustomer = await this.db.transaction(async (tx) => {
      const [omiseCustomer] = await tx
        .insert(omiseCustomersSchema)
        .values({ userId, customerId: omiseCustomerId })
        .onConflictDoUpdate({
          target: omiseCustomersSchema.userId,
          set: {
            customerId: omiseCustomerId,
          },
        })
        .returning();

      return omiseCustomer;
    });

    return omiseCustomer;
  }

  async recordOmiseCards(
    userId: string,
    cardIds: CardId[],
  ): Promise<OmiseCard[]> {
    const omiseCards = await this.db
      .insert(omiseCardsSchema)
      .values(cardIds.map((cardId) => ({ userId, cardId })))
      .onConflictDoNothing()
      .returning();

    return omiseCards;
  }

  async getOmiseCustomer(userId: string): Promise<OmiseCustomer | undefined> {
    const [omiseCustomer] = await this.db
      .select()
      .from(omiseCustomersSchema)
      .limit(1)
      .where(eq(omiseCustomersSchema.userId, userId));
    return omiseCustomer;
  }
}
