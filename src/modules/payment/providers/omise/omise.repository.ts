import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import { omiseCustomers } from '@/database/schema';
import { eq } from 'drizzle-orm';

type OmiseCustomer = typeof omiseCustomers.$inferSelect;

@Injectable()
export class OmiseRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async recordOmiseCustomer(
    userId: string,
    omiseCustomerId: string,
  ): Promise<OmiseCustomer> {
    const omiseCustomer = await this.db.transaction(async (tx) => {
      const [omiseCustomer] = await tx
        .insert(omiseCustomers)
        .values({ userId, customerId: omiseCustomerId })
        .onConflictDoUpdate({
          target: omiseCustomers.userId,
          set: {
            customerId: omiseCustomerId,
          },
        })
        .returning();

      return omiseCustomer;
    });

    return omiseCustomer;
  }

  async getOmiseCustomer(userId: string): Promise<OmiseCustomer | undefined> {
    const omiseCustomer = await this.db.query.omiseCustomers.findFirst({
      where: eq(omiseCustomers.userId, userId),
    });

    return omiseCustomer;
  }
}
