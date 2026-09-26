import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import { SessionUser } from '@/modules/auth/auth.config';
import { service as serviceMock } from '@/mock/services';
import { invoicePending } from '@/mock/invoices';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import { CreateInvoiceDto } from '@/modules/payment/dto/invoice.dto';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  serviceAppointments,
  serviceAppointmentsOnInvoice,
  serviceInvoices,
  services,
} from '@/database/schema';
import { and, count, countDistinct, eq, gt, lt, sql } from 'drizzle-orm';
import { PaymentConfig } from '@/modules/payment/payment.constants';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import { InvoiceDto } from '@/modules/payment/dto/invoice.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly config: ConfigService,
    private readonly paymentProvider: IPaymentProvider,
    @Inject(DRIZZLE) private readonly database: DrizzleDB,
  ) {}

  async createInvoice(user: SessionUser, dto: CreateInvoiceDto) {
    if (new Set(dto.startTimes).size !== dto.startTimes.length)
      throw new BadRequestException(PaymentConfig.messages.duplicateStartTimes);

    const invoice = await this.database.transaction(async (tx) => {
      await tx
        .update(serviceInvoices)
        .set({ status: 'FAILED' })
        .where(
          and(
            eq(serviceInvoices.status, 'PENDING'),
            lt(
              serviceInvoices.createdAt,
              sql`now() - (${PaymentConfig.invoice.pendingLimitSeconds} * interval '1 second')`,
            ),
          ),
        );

      const pendingInvoices = await tx
        .select({ value: countDistinct(serviceInvoices.id) })
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
            eq(serviceInvoices.status, 'PENDING'),
            eq(serviceAppointments.adviseeId, user.id),
          ),
        );
      if (pendingInvoices[0].value >= PaymentConfig.invoice.pendingLimit)
        throw new BadRequestException(
          PaymentConfig.messages.exceedPendingInvoiceLimit,
        );

      const [currentService] = await tx
        .select()
        .from(services)
        .where(eq(services.id, dto.serviceId))
        .limit(1);
      if (!currentService)
        throw new BadRequestException(PaymentConfig.messages.serviceNotFound);

      // TODO: call booking service

      const overlappingAppointments = await Promise.all(
        dto.startTimes.map((st) => {
          const startTime = new Date(st);
          const endTime = new Date(
            startTime.getTime() + currentService.durationMinutes * 60_000,
          );

          return tx
            .select({ value: count() })
            .from(serviceAppointments)
            .where(
              and(
                eq(serviceAppointments.serviceId, dto.serviceId),
                lt(serviceAppointments.startTime, endTime),
                gt(serviceAppointments.endTime, startTime),
              ),
            );
        }),
      );
      const overlappingAppointmentCount = overlappingAppointments.reduce(
        (acc, [result]) => acc + (result?.value ?? 0),
        0,
      );
      if (overlappingAppointmentCount > 0)
        throw new BadRequestException(
          PaymentConfig.messages.overlappingAppointments,
        );

      const appointmentsData: (typeof serviceAppointments.$inferInsert)[] =
        dto.startTimes.map((st) => ({
          adviseeId: user.id,

          startTime: new Date(st),
          endTime: new Date(
            new Date(st).valueOf() + currentService.durationMinutes * 60_000,
          ),
          unavailableUntil: new Date(
            new Date(st).valueOf() + currentService.durationMinutes * 60_000,
          ),

          serviceId: dto.serviceId,
          advisorId: currentService.advisorId,
        }));

      const appointments = await tx
        .insert(serviceAppointments)
        .values(appointmentsData)
        .returning();

      // TODO: call booking service

      const [invoice] = await tx
        .insert(serviceInvoices)
        .values({
          amountSatang: currentService.priceSatang * dto.startTimes.length,
          platformFeeSatang: Math.round(
            PaymentConfig.invoice.platformFeeFraction *
              (currentService.priceSatang * dto.startTimes.length),
          ),
          status: 'PENDING',
        })
        .returning();

      await tx.insert(serviceAppointmentsOnInvoice).values(
        appointments.map((ap) => ({
          serviceAppointmentId: ap.id,
          serviceInvoiceId: invoice.id,
        })),
      );

      return invoice;
    });

    return {
      url: `${this.config.get(ENV_KEYS.FRONTEND_URL)}${PaymentConfig.invoice.createRedirectPath}?invoiceId=${invoice.id}`,
    };
  }

  async getInvoiceById(user: SessionUser, id: string): Promise<InvoiceDto> {
    const invoice = await this.database.query.serviceInvoices.findFirst({
      columns: {
        id: true,
        amountSatang: true,
        createdAt: true,
        platformFeeSatang: true,
        status: true,
      },
      where: {
        id: id,
      },
    });

    if (!invoice)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);

    return invoice;
  }

  async checkout(user: SessionUser, dto: CheckoutDto) {
    // get price
    // TODO: replace
    const service = serviceMock;
    // create service booking
    // const booking = appointmentPendingPayment;
    // create invoice w/ omise charge id
    const invoice = invoicePending;
    // create omise charge
    const chargeResult = await this.paymentProvider.chargeSpecificCard(
      user,
      service.priceSatang,
      dto.cardToken,
      `http://localhost:3000/payments/verify/${invoice.invoiceId}`,
    );
    if (chargeResult.status !== 'success')
      throw new InternalServerErrorException(chargeResult);
    // redirect to 3ds w/ redirect uri to service booking
    return { url: chargeResult.redirectUrl };
    // retrieve omise charge
    // update invoice
  }
}
