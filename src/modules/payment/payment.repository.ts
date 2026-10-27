import { serviceName } from '@/common/i18n/localized-columns';
import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  serviceAppointments,
  serviceAppointmentsOnInvoice,
  serviceInvoices,
  services,
  user,
} from '@/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, type InferSelectModel } from 'drizzle-orm';

type Invoice = InferSelectModel<typeof serviceInvoices>;
type Appointment = InferSelectModel<typeof serviceAppointments>;

/** One invoice as the Advisee's transaction history and receipt read it. */
export interface AdviseeInvoiceRow {
  invoice: Pick<
    Invoice,
    | 'id'
    | 'invoiceNumber'
    | 'status'
    | 'amountSatang'
    | 'platformFeeSatang'
    | 'createdAt'
    | 'paidAt'
    | 'cardBrand'
    | 'cardLastDigits'
  >;
  service: { id: string; name: string };
  advisor: { id: string; displayName: string };
  /** The invoice's earliest appointment. */
  appointment: Pick<
    Appointment,
    'startTime' | 'endTime' | 'state' | 'cancelledAt'
  >;
}

@Injectable()
export class PaymentServiceInvoicesRepository extends EntityRepository<
  typeof serviceInvoices
> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, serviceInvoices);
  }

  async findPublicById(id: string, userId: string) {
    return (
      await this.db
        .select({
          id: serviceInvoices.id,
          amountSatang: serviceInvoices.amountSatang,
          createdAt: serviceInvoices.createdAt,
          platformFeeSatang: serviceInvoices.platformFeeSatang,
          status: serviceInvoices.status,
        })
        .from(serviceInvoices)
        .innerJoin(
          serviceAppointmentsOnInvoice,
          eq(serviceInvoices.id, serviceAppointmentsOnInvoice.serviceInvoiceId),
        )
        .innerJoin(
          serviceAppointments,
          eq(
            serviceAppointmentsOnInvoice.serviceAppointmentId,
            serviceAppointments.id,
          ),
        )
        .where(
          and(
            eq(serviceInvoices.id, id),
            eq(serviceAppointments.adviseeId, userId),
          ),
        )
        .limit(1)
    )[0];
  }

  async findWithServiceById(id: string, userId: string) {
    const invoicePromise = this.db
      .select({
        invoice: {
          id: serviceInvoices.id,
          amountSatang: serviceInvoices.amountSatang,
          createdAt: serviceInvoices.createdAt,
          platformFeeSatang: serviceInvoices.platformFeeSatang,
          status: serviceInvoices.status,
          providerChargeId: serviceInvoices.providerChargeId,
        },
        service: {
          advisorFullName: user.fullName,
          name: serviceName(),
        },
      })
      .from(serviceInvoices)
      .innerJoin(
        serviceAppointmentsOnInvoice,
        eq(serviceInvoices.id, serviceAppointmentsOnInvoice.serviceInvoiceId),
      )
      .innerJoin(
        serviceAppointments,
        eq(
          serviceAppointmentsOnInvoice.serviceAppointmentId,
          serviceAppointments.id,
        ),
      )
      .innerJoin(services, eq(serviceAppointments.serviceId, services.id))
      .innerJoin(user, eq(services.advisorId, user.id))
      .where(
        and(
          eq(serviceInvoices.id, id),
          eq(serviceAppointments.adviseeId, userId),
        ),
      )
      .limit(1);

    const appointmentsPromise = this.db
      .select({
        startTime: serviceAppointments.startTime,
        endTime: serviceAppointments.endTime,
      })
      .from(serviceInvoices)
      .innerJoin(
        serviceAppointmentsOnInvoice,
        eq(serviceInvoices.id, serviceAppointmentsOnInvoice.serviceInvoiceId),
      )
      .innerJoin(
        serviceAppointments,
        eq(
          serviceAppointmentsOnInvoice.serviceAppointmentId,
          serviceAppointments.id,
        ),
      )
      .where(
        and(
          eq(serviceInvoices.id, id),
          eq(serviceAppointments.adviseeId, userId),
        ),
      );
    return {
      ...(await invoicePromise)[0],
      appointments: await appointmentsPromise,
    };
  }

  /**
   * One page of the invoices the user paid for as the Advisee, newest first. `id` breaks a tie
   * in `created_at`, so two invoices from the same instant never swap places between pages.
   */
  findManyForAdvisee(
    adviseeId: string,
    options: { limit: number; offset: number },
  ): Promise<AdviseeInvoiceRow[]> {
    return this.selectForAdvisee(adviseeId)
      .orderBy(desc(serviceInvoices.createdAt), desc(serviceInvoices.id))
      .limit(options.limit)
      .offset(options.offset);
  }

  /** One of the user's own invoices. Someone else's and a missing id are both `undefined`. */
  async findOneForAdvisee(
    invoiceId: string,
    adviseeId: string,
  ): Promise<AdviseeInvoiceRow | undefined> {
    const [row] = await this.selectForAdvisee(adviseeId)
      .where(eq(serviceInvoices.id, invoiceId))
      .limit(1);
    return row;
  }

  /**
   * Counted over the same joins `selectForAdvisee` uses, not through the inherited `count()`.
   * Ownership lives in the joined appointments, so `service_invoices` alone would count every
   * user's invoices; and a count missing a join its predicate needs is how `countPublished` in
   * advisor-services.repository.ts once answered 500 to every request.
   */
  async countForAdvisee(adviseeId: string): Promise<number> {
    const first = this.firstAppointments(adviseeId);
    const [row] = await this.db
      .select({ value: count() })
      .from(serviceInvoices)
      .innerJoin(first, eq(first.invoiceId, serviceInvoices.id))
      .innerJoin(services, eq(services.id, first.serviceId))
      .innerJoin(user, eq(user.id, first.advisorId));
    return row?.value ?? 0;
  }

  /**
   * The receipt's columns: the invoice, its earliest appointment, and that appointment's Service
   * and Advisor. Every join is inner and runs through `firstAppointments`, so an invoice is one
   * row however many appointments it pays for.
   */
  private selectForAdvisee(adviseeId: string) {
    const first = this.firstAppointments(adviseeId);
    return this.db
      .select({
        invoice: {
          id: serviceInvoices.id,
          invoiceNumber: serviceInvoices.invoiceNumber,
          status: serviceInvoices.status,
          amountSatang: serviceInvoices.amountSatang,
          platformFeeSatang: serviceInvoices.platformFeeSatang,
          createdAt: serviceInvoices.createdAt,
          paidAt: serviceInvoices.paidAt,
          cardBrand: serviceInvoices.cardBrand,
          cardLastDigits: serviceInvoices.cardLastDigits,
        },
        // Becomes `serviceName()` from src/common/i18n/localized-columns.ts once the content translations PR lands.
        service: { id: services.id, name: services.name },
        advisor: { id: user.id, displayName: user.displayName },
        appointment: {
          startTime: first.startTime,
          endTime: first.endTime,
          state: first.state,
          cancelledAt: first.cancelledAt,
        },
      })
      .from(serviceInvoices)
      .innerJoin(first, eq(first.invoiceId, serviceInvoices.id))
      .innerJoin(services, eq(services.id, first.serviceId))
      .innerJoin(user, eq(user.id, first.advisorId));
  }

  /**
   * Each of the Advisee's invoices paired with its earliest appointment, one row per invoice.
   * This is where ownership is decided: an invoice is the Advisee's when it pays for their
   * appointments. Filtering on the Advisee first means only their own appointments are read;
   * DISTINCT ON then keeps each invoice's first row in `start_time` order, `id` breaking a tie.
   */
  private firstAppointments(adviseeId: string) {
    return this.db
      .selectDistinctOn([serviceAppointmentsOnInvoice.serviceInvoiceId], {
        invoiceId: serviceAppointmentsOnInvoice.serviceInvoiceId,
        serviceId: serviceAppointments.serviceId,
        advisorId: serviceAppointments.advisorId,
        startTime: serviceAppointments.startTime,
        endTime: serviceAppointments.endTime,
        state: serviceAppointments.state,
        cancelledAt: serviceAppointments.cancelledAt,
      })
      .from(serviceAppointmentsOnInvoice)
      .innerJoin(
        serviceAppointments,
        eq(
          serviceAppointments.id,
          serviceAppointmentsOnInvoice.serviceAppointmentId,
        ),
      )
      .where(eq(serviceAppointments.adviseeId, adviseeId))
      .orderBy(
        serviceAppointmentsOnInvoice.serviceInvoiceId,
        serviceAppointments.startTime,
        serviceAppointments.id,
      )
      .as('first_appointment');
  }
}
