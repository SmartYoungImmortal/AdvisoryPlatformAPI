import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, type SQL } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  refundCaseEvidence,
  refundCases,
  serviceAppointments,
  serviceInvoices,
  user,
} from '@/database/schema';
import { REFUND_CASE_OPEN_STATUS } from './refunds.constants';
import type {
  AdminRefundCaseRow,
  DisputableInvoice,
  RefundCase,
  RefundCaseEvidenceRow,
  RefundCaseStatus,
} from './refunds.types';

@Injectable()
export class RefundsRepository extends EntityRepository<typeof refundCases> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, refundCases);
  }

  /**
   * The ownership check `POST /api/v1/refunds` turns on, resolved in one query.
   *
   * `service_invoices` has no payer column — an invoice belongs to the Advisee of the appointment
   * it was issued for — so the claim is only provable through `service_appointments`. A caller
   * naming a stranger's invoice gets `undefined`, indistinguishable from naming one that does not
   * exist. Without this join the route would let anybody open a case against anybody's payment.
   */
  async findDisputableInvoice(
    invoiceId: string,
    adviseeId: string,
  ): Promise<DisputableInvoice | undefined> {
    const [invoice] = await this.db
      .select({
        id: serviceInvoices.id,
        amountSatang: serviceInvoices.amountSatang,
      })
      .from(serviceInvoices)
      .innerJoin(
        serviceAppointments,
        eq(serviceAppointments.id, serviceInvoices.appointmentId),
      )
      .where(
        and(
          eq(serviceInvoices.id, invoiceId),
          eq(serviceAppointments.adviseeId, adviseeId),
        ),
      )
      .limit(1);
    return invoice;
  }

  /** Whether this invoice is already being disputed. Resolved cases do not block a new one. */
  async openCaseExists(invoiceId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: refundCases.id })
      .from(refundCases)
      .where(
        and(
          eq(refundCases.invoiceId, invoiceId),
          eq(refundCases.status, REFUND_CASE_OPEN_STATUS),
        ),
      )
      .limit(1);
    return row !== undefined;
  }

  findManyForRequester(
    requesterId: string,
    options: { limit: number; offset: number },
  ): Promise<RefundCase[]> {
    return this.db
      .select()
      .from(refundCases)
      .where(eq(refundCases.requestedByUserId, requesterId))
      .orderBy(asc(refundCases.createdAt), asc(refundCases.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same single table `findManyForRequester` selects from, and filtered by the
   * same predicate. The inherited `count()` is only safe here because neither side joins.
   */
  countForRequester(requesterId: string): Promise<number> {
    return this.count(eq(refundCases.requestedByUserId, requesterId));
  }

  /** Oldest first: this is a work queue, and the case waiting longest is the one to rule on next. */
  findManyForAdmin(
    status: RefundCaseStatus | undefined,
    options: { limit: number; offset: number },
  ): Promise<AdminRefundCaseRow[]> {
    return this.adminSelect(this.adminWhere(status))
      .orderBy(asc(refundCases.createdAt), asc(refundCases.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /**
   * Counted over the same two joins `adminSelect` uses, not through the inherited `count()`.
   *
   * `countPublished` in `advisor-services.repository.ts` documents what happens otherwise: a count
   * that selects `from(refundCases)` alone while the page joins `user` and `service_invoices`
   * emits SQL whose FROM clause is missing those tables, and Postgres rejects the statement — the
   * route then answers 500 on every request. Joining the same way also keeps the total honest,
   * since an inner join is itself a filter.
   */
  async countForAdmin(status?: RefundCaseStatus): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(refundCases)
      .innerJoin(user, eq(user.id, refundCases.requestedByUserId))
      .innerJoin(serviceInvoices, eq(serviceInvoices.id, refundCases.invoiceId))
      .where(this.adminWhere(status));
    return row?.value ?? 0;
  }

  async findOneForAdmin(
    refundCaseId: string,
  ): Promise<AdminRefundCaseRow | undefined> {
    const [row] = await this.adminSelect(
      eq(refundCases.id, refundCaseId),
    ).limit(1);
    return row;
  }

  findEvidence(refundCaseId: string): Promise<RefundCaseEvidenceRow[]> {
    return this.db
      .select({
        objectKey: refundCaseEvidence.objectKey,
        originalFileName: refundCaseEvidence.originalFileName,
        mimeType: refundCaseEvidence.mimeType,
        createdAt: refundCaseEvidence.createdAt,
      })
      .from(refundCaseEvidence)
      .where(eq(refundCaseEvidence.refundCaseId, refundCaseId))
      .orderBy(asc(refundCaseEvidence.createdAt));
  }

  /**
   * Applies a ruling only while the case is still open. An `undefined` result means another Admin
   * ruled between the service's read and this write, which the service reports as the same 409 as
   * a case that was already resolved when it was read.
   */
  async ruleOpenCase(
    refundCaseId: string,
    values: PgUpdateSetSource<typeof refundCases>,
  ): Promise<RefundCase | undefined> {
    const [refundCase] = await this.updateWhere(
      and(
        eq(refundCases.id, refundCaseId),
        eq(refundCases.status, REFUND_CASE_OPEN_STATUS),
      ) as SQL,
      values,
    );
    return refundCase;
  }

  /**
   * One shape for every Admin refund response: the case, who raised it, and what the disputed
   * invoice was worth. Both joins are inner because both foreign keys are `notNull`.
   */
  private adminSelect(where: SQL | undefined) {
    return this.db
      .select({
        id: refundCases.id,
        invoiceId: refundCases.invoiceId,
        requestedByUserId: refundCases.requestedByUserId,
        requesterDisplayName: user.displayName,
        invoiceAmountSatang: serviceInvoices.amountSatang,
        reason: refundCases.reason,
        status: refundCases.status,
        reviewedByAdminId: refundCases.reviewedByAdminId,
        createdAt: refundCases.createdAt,
        resolvedAt: refundCases.resolvedAt,
      })
      .from(refundCases)
      .innerJoin(user, eq(user.id, refundCases.requestedByUserId))
      .innerJoin(serviceInvoices, eq(serviceInvoices.id, refundCases.invoiceId))
      .where(where)
      .$dynamic();
  }

  private adminWhere(status?: RefundCaseStatus): SQL | undefined {
    return status ? eq(refundCases.status, status) : undefined;
  }
}
