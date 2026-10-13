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
import { and, eq } from 'drizzle-orm';

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
          name: services.name,
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
}
