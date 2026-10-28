import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import { SessionUser } from '@/modules/auth/auth.config';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import {
  CreateInvoiceDto,
  PaymentStatusDto,
} from '@/modules/payment/dto/invoice.dto';
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
import { PaymentServiceInvoicesRepository } from '@/modules/payment/payment.repository';
import { AdviseeInvoiceResponseDto } from '@/modules/payment/dto/advisee-invoice-response.dto';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';

/**
 * The card a charge result names, as the two columns a receipt shows. The provider answers an
 * empty string when it never reached a card, which is stored as unknown rather than blank.
 */
function chargedCard(result: { brand: string; lastDigits: string }) {
  return {
    cardBrand: result.brand || null,
    cardLastDigits: result.lastDigits || null,
  };
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly config: ConfigService,
    private readonly paymentProvider: IPaymentProvider,
    private readonly serviceInvoiceRepository: PaymentServiceInvoicesRepository,
    @Inject(DRIZZLE) private readonly database: DrizzleDB,
  ) {}

  async createInvoice(
    user: SessionUser,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceDto> {
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
      id: invoice.id,
      amountSatang: invoice.amountSatang,
      createdAt: invoice.createdAt,
      platformFeeSatang: invoice.platformFeeSatang,
      status: invoice.status,
    };
  }

  async getInvoiceById(
    user: SessionUser,
    invoiceId: string,
  ): Promise<InvoiceDto> {
    const invoice = await this.serviceInvoiceRepository.findPublicById(
      invoiceId,
      user.id,
    );

    if (!invoice)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);

    return invoice;
  }

  /** The user's transaction history as the Advisee: every invoice in any status, newest first. */
  findMyInvoices(
    user: SessionUser,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<AdviseeInvoiceResponseDto>> {
    return paginateQuery(
      page,
      (options) =>
        this.serviceInvoiceRepository.findManyForAdvisee(user.id, options),
      () => this.serviceInvoiceRepository.countForAdvisee(user.id),
      (row) => new AdviseeInvoiceResponseDto(row),
    );
  }

  async findMyBookingInvoice(
    user: SessionUser,
    bookingId: string,
  ): Promise<AdviseeInvoiceResponseDto> {
    const row = await this.serviceInvoiceRepository.findForBooking(
      bookingId,
      user.id,
    );
    if (!row)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);
    return new AdviseeInvoiceResponseDto(row);
  }

  /** One receipt. Another user's invoice is the same 404 as one that does not exist. */
  async findMyInvoice(
    user: SessionUser,
    invoiceId: string,
  ): Promise<AdviseeInvoiceResponseDto> {
    const row = await this.serviceInvoiceRepository.findOneForAdvisee(
      invoiceId,
      user.id,
    );
    if (!row)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);
    return new AdviseeInvoiceResponseDto(row);
  }

  async getPaymentStatus(
    user: SessionUser,
    invoiceId: string,
  ): Promise<PaymentStatusDto> {
    const data = await this.serviceInvoiceRepository.findWithServiceById(
      invoiceId,
      user.id,
    );

    if (!data || !data.invoice.providerChargeId)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);

    const { providerChargeId, ...publicInvoice } = data.invoice;

    const chargeStatus =
      await this.paymentProvider.getChargeStatus(providerChargeId);

    const publicChargeStatus =
      chargeStatus.status === 'success'
        ? (({ chargeId: _chargeId, ...status }) => {
            void _chargeId;
            return status;
          })(chargeStatus)
        : chargeStatus;

    return {
      appointments: data.appointments,
      service: data.service,
      invoice: publicInvoice,
      chargeStatus: publicChargeStatus,
    };
  }

  async paymentCallback(user: SessionUser, id: string) {
    const invoice = await this.serviceInvoiceRepository.findById(id);

    if (!invoice || !invoice.providerChargeId)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);

    const chargeResult = await this.paymentProvider.getChargeStatus(
      invoice.providerChargeId,
    );
    // The 3-D Secure return is where a charge's outcome is first known. Checkout clears `paidAt`
    // for every new charge, so recording only into an empty `paidAt` keeps the first moment when
    // this page is reloaded.
    if (chargeResult.status !== 'pending' && !invoice.paidAt)
      await this.serviceInvoiceRepository.updateById(invoice.id, {
        ...chargedCard(chargeResult),
        paidAt: new Date(),
      });

    return {
      url: `${this.config.get(ENV_KEYS.FRONTEND_URL)}${PaymentConfig.checkoutCallback.redirectPaths[chargeResult.status]}?invoiceId=${invoice.id}`,
    };
  }

  async checkout(user: SessionUser, dto: CheckoutDto) {
    // get invoice
    const invoice = await this.serviceInvoiceRepository.findPublicById(
      dto.invoiceId,
      user.id,
    );
    if (!invoice)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);
    // create omise charge
    const redirectUrl = `${this.config.get(ENV_KEYS.BACKEND_PUBLIC_URL)}${PaymentConfig.checkout.redirectPaths.callback}/${invoice.id}`;
    const chargeResult = await this.paymentProvider.chargeSpecificCard(
      user,
      invoice.amountSatang,
      dto.cardToken,
      redirectUrl,
    );
    // A declined charge is an outcome too: the receipt dates the failure and names the card.
    if (chargeResult.status === 'failed')
      await this.serviceInvoiceRepository.updateById(invoice.id, {
        ...chargedCard(chargeResult),
        paidAt: new Date(),
      });
    if (chargeResult.status !== 'success')
      throw new InternalServerErrorException(chargeResult);
    // save omise charge id. The card is known now; the outcome only once 3-D Secure returns, so
    // any earlier attempt's `paidAt` is cleared for the callback to fill.
    await this.serviceInvoiceRepository.updateById(dto.invoiceId, {
      providerChargeId: chargeResult.chargeId,
      ...chargedCard(chargeResult),
      paidAt: null,
    });
    // redirect to 3ds w/ redirect uri to service booking
    return { url: chargeResult.redirectUrl };
    // retrieve omise charge
    // update invoice
  }
}
