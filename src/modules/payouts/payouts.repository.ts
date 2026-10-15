import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, type SQL } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  payoutInvoices,
  payouts,
  serviceInvoices,
  user,
} from '@/database/schema';
import { PAYOUT_PENDING_STATUS } from './payouts.constants';
import type {
  AdminPayoutRow,
  Payout,
  PayoutInvoiceRow,
  PayoutStatus,
} from './payouts.types';

@Injectable()
export class PayoutsRepository extends EntityRepository<typeof payouts> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, payouts);
  }

  /** Oldest first: this is a queue, and the payout waiting longest is the one to release next. */
  findManyForAdmin(
    filters: { status?: PayoutStatus; advisorId?: string },
    options: { limit: number; offset: number },
  ): Promise<AdminPayoutRow[]> {
    return this.adminSelect(this.adminWhere(filters))
      .orderBy(asc(payouts.createdAt), asc(payouts.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same `user` join `adminSelect` uses, not through the inherited `count()`.
   *
   * `countPublished` in `advisor-services.repository.ts` documents the failure this avoids: a count
   * selecting `from(payouts)` alone while the page joins `user` produces SQL whose FROM clause is
   * missing `user`, Postgres rejects the statement outright, and the route answers 500 on every
   * request. An inner join is also a filter, so counting without it would overstate the total.
   */
  async countForAdmin(filters: {
    status?: PayoutStatus;
    advisorId?: string;
  }): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(payouts)
      .innerJoin(user, eq(user.id, payouts.advisorId))
      .where(this.adminWhere(filters));
    return row?.value ?? 0;
  }

  async findOneForAdmin(payoutId: string): Promise<AdminPayoutRow | undefined> {
    const [row] = await this.adminSelect(eq(payouts.id, payoutId)).limit(1);
    return row;
  }

  /** The invoices this payout settles, reached through the `payout_invoices` junction table. */
  findInvoices(payoutId: string): Promise<PayoutInvoiceRow[]> {
    return this.db
      .select({
        invoiceId: serviceInvoices.id,
        appointmentId: serviceInvoices.appointmentId,
        amountSatang: serviceInvoices.amountSatang,
        platformFeeSatang: serviceInvoices.platformFeeSatang,
        status: serviceInvoices.status,
        payoutEligibleAt: serviceInvoices.payoutEligibleAt,
        createdAt: serviceInvoices.createdAt,
      })
      .from(payoutInvoices)
      .innerJoin(
        serviceInvoices,
        eq(serviceInvoices.id, payoutInvoices.invoiceId),
      )
      .where(eq(payoutInvoices.payoutId, payoutId))
      .orderBy(asc(serviceInvoices.createdAt), asc(serviceInvoices.id));
  }

  /** Newest first: an Advisor reads their own payouts as a statement, most recent at the top. */
  findManyForAdvisor(
    advisorId: string,
    options: { limit: number; offset: number },
  ): Promise<Payout[]> {
    return this.db
      .select()
      .from(payouts)
      .where(eq(payouts.advisorId, advisorId))
      .orderBy(desc(payouts.createdAt), asc(payouts.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same single table `findManyForAdvisor` selects from, with the same predicate.
   * The inherited `count()` is only safe here because neither side joins.
   */
  countForAdvisor(advisorId: string): Promise<number> {
    return this.count(eq(payouts.advisorId, advisorId));
  }

  /**
   * Settles a payout only while it is still pending. An `undefined` result means another Admin got
   * there first, which the service reports as the same 409 as a payout that was already terminal
   * when it was read.
   */
  async settlePendingPayout(
    payoutId: string,
    values: PgUpdateSetSource<typeof payouts>,
  ): Promise<Payout | undefined> {
    const [payout] = await this.updateWhere(
      and(
        eq(payouts.id, payoutId),
        eq(payouts.status, PAYOUT_PENDING_STATUS),
      ) as SQL,
      values,
    );
    return payout;
  }

  /**
   * One shape for every Admin payout response. The join is inner because `advisorId` is `notNull`
   * and chains to `user` through `advisor_profiles`.
   */
  private adminSelect(where: SQL | undefined) {
    return this.db
      .select({
        id: payouts.id,
        advisorId: payouts.advisorId,
        advisorDisplayName: user.displayName,
        amountSatang: payouts.amountSatang,
        transferFeeSatang: payouts.transferFeeSatang,
        providerTransferId: payouts.providerTransferId,
        status: payouts.status,
        createdAt: payouts.createdAt,
        paidAt: payouts.paidAt,
      })
      .from(payouts)
      .innerJoin(user, eq(user.id, payouts.advisorId))
      .where(where)
      .$dynamic();
  }

  private adminWhere(filters: {
    status?: PayoutStatus;
    advisorId?: string;
  }): SQL | undefined {
    return and(
      filters.status ? eq(payouts.status, filters.status) : undefined,
      filters.advisorId ? eq(payouts.advisorId, filters.advisorId) : undefined,
    );
  }
}
