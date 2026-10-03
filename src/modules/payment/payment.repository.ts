import { EntityRepository } from '@/common/repositories/entity.repository';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  serviceAppointments,
  serviceAppointmentsOnInvoice,
  serviceInvoices,
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
}
