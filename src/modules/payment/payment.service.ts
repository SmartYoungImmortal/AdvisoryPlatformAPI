import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import type {
  PromptPayDto,
  PromptPayResponse,
  PromptPayStatusResponse,
} from '@/modules/payment/dto/promptpay.dto';
import type { MobileBankingDto } from '@/modules/payment/dto/mobile-banking.dto';
import { SessionUser } from '@/modules/auth/auth.config';
import { IPaymentProvider } from '@/modules/payment/providers/interface';
import {
  MOBILE_BANKS,
  PROMPTPAY_BRAND,
  type ChargeStatus,
} from '@/modules/payment/providers/providers';
import {
  CreateInvoiceDto,
  PaymentStatusDto,
} from '@/modules/payment/dto/invoice.dto';
import { DRIZZLE, type DrizzleDB } from '@/database/database.module';
import {
  coupons,
  serviceAppointments,
  serviceAppointmentsOnInvoice,
  serviceInvoices,
  servicePackages,
  services,
} from '@/database/schema';
import { BookingsService } from '@/modules/bookings/bookings.service';
import type {
  CouponPreviewDto,
  CouponPreviewResponse,
} from '@/modules/payment/dto/coupon.dto';
import {
  and,
  count,
  countDistinct,
  eq,
  gt,
  inArray,
  lt,
  sql,
} from 'drizzle-orm';
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

/**
 * What a coupon takes off a price, in satang: its share, rounded to the satang, or its fixed
 * amount, and never more than the price.
 */
export function couponDiscount(
  coupon: { percentOff: number | null; amountOffSatang: number | null },
  priceSatang: number,
): number {
  if (coupon.percentOff !== null)
    return Math.round((priceSatang * coupon.percentOff) / 100);
  return Math.min(coupon.amountOffSatang ?? 0, priceSatang);
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly config: ConfigService,
    private readonly paymentProvider: IPaymentProvider,
    private readonly serviceInvoiceRepository: PaymentServiceInvoicesRepository,
    @Inject(DRIZZLE) private readonly database: DrizzleDB,
    private readonly bookings: BookingsService,
  ) {}

  /** What the browser needs to turn a card into a token: the account's public key, never the secret. */
  publicKey(): { publicKey: string } {
    return {
      publicKey: this.config.get<string>(ENV_KEYS.OMISE_PUBLIC_KEY) ?? '',
    };
  }

  /**
   * The Advisee's own booking still waiting for payment, and its price as booked: the package's,
   * or the service's when it is sold as itself.
   */
  private async payableBooking(
    db: Pick<DrizzleDB, 'select'>,
    user: SessionUser,
    bookingId: string,
  ): Promise<{ id: string; priceSatang: number }> {
    const [appointment] = await db
      .select({
        id: serviceAppointments.id,
        state: serviceAppointments.state,
        serviceId: serviceAppointments.serviceId,
        packageId: serviceAppointments.packageId,
      })
      .from(serviceAppointments)
      .where(
        and(
          eq(serviceAppointments.id, bookingId),
          eq(serviceAppointments.adviseeId, user.id),
        ),
      )
      .limit(1);
    if (!appointment)
      throw new NotFoundException(PaymentConfig.messages.bookingNotFound);
    if (appointment.state !== 'PENDING_PAYMENT')
      throw new BadRequestException(PaymentConfig.messages.bookingNotPayable);

    const [booked] = appointment.packageId
      ? await db
          .select({ priceSatang: servicePackages.priceSatang })
          .from(servicePackages)
          .where(eq(servicePackages.id, appointment.packageId))
          .limit(1)
      : [];
    const [service] = booked
      ? [booked]
      : await db
          .select({ priceSatang: services.priceSatang })
          .from(services)
          .where(eq(services.id, appointment.serviceId))
          .limit(1);
    if (!service)
      throw new BadRequestException(PaymentConfig.messages.serviceNotFound);
    return { id: appointment.id, priceSatang: service.priceSatang };
  }

  /**
   * A coupon that can be used now, and what it takes off `priceSatang`: a share of it, rounded, or
   * a fixed amount, never more than the price. Unknown, inactive, expired and used-up codes are
   * all the same refusal, so the answer tells nobody which codes exist.
   */
  private async applyCoupon(
    db: Pick<DrizzleDB, 'select'>,
    rawCode: string,
    priceSatang: number,
  ): Promise<{ id: string; code: string; discountSatang: number }> {
    const code = rawCode.trim().toUpperCase();
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code))
      .limit(1);
    const expired =
      coupon?.expiresAt && coupon.expiresAt.getTime() <= Date.now();
    if (!coupon?.active || expired)
      throw new BadRequestException(PaymentConfig.messages.couponNotValid);
    if (coupon.maxRedemptions !== null) {
      const [used] = await db
        .select({ value: count() })
        .from(serviceInvoices)
        .where(
          and(
            eq(serviceInvoices.couponId, coupon.id),
            inArray(serviceInvoices.status, ['HELD_IN_ESCROW', 'RELEASED']),
          ),
        );
      if ((used?.value ?? 0) >= coupon.maxRedemptions)
        throw new BadRequestException(PaymentConfig.messages.couponNotValid);
    }
    return {
      id: coupon.id,
      code: coupon.code,
      discountSatang: couponDiscount(coupon, priceSatang),
    };
  }

  /** What a coupon would take off a booking, for checkout to show before anything is charged. */
  async previewCoupon(
    user: SessionUser,
    dto: CouponPreviewDto,
  ): Promise<CouponPreviewResponse> {
    const booking = await this.payableBooking(
      this.database,
      user,
      dto.bookingId,
    );
    const coupon = await this.applyCoupon(
      this.database,
      dto.code,
      booking.priceSatang,
    );
    return {
      code: coupon.code,
      priceSatang: booking.priceSatang,
      discountSatang: coupon.discountSatang,
      amountSatang: booking.priceSatang - coupon.discountSatang,
    };
  }

  /**
   * The invoice that pays for a booking `POST /bookings` has already held. The booking's own
   * appointment is the one on the invoice — `createInvoice` books its own appointments, which
   * would collide with the held one — and it is priced as booked, less the coupon if one is given.
   * An invoice already waiting on the booking with the same coupon is returned rather than a
   * second one made, so a reloaded checkout pays the same invoice; one priced differently that
   * was never charged is retired for the new one; a failed one is left behind.
   */
  async createBookingInvoice(
    user: SessionUser,
    bookingId: string,
    couponCode?: string,
  ): Promise<InvoiceDto> {
    const invoice = await this.database.transaction(async (tx) => {
      const booking = await this.payableBooking(tx, user, bookingId);
      const coupon = couponCode?.trim()
        ? await this.applyCoupon(tx, couponCode, booking.priceSatang)
        : null;

      const [open] = await tx
        .select({ invoice: serviceInvoices })
        .from(serviceInvoices)
        .innerJoin(
          serviceAppointmentsOnInvoice,
          eq(serviceInvoices.id, serviceAppointmentsOnInvoice.serviceInvoiceId),
        )
        .where(
          and(
            eq(serviceAppointmentsOnInvoice.serviceAppointmentId, booking.id),
            eq(serviceInvoices.status, 'PENDING'),
          ),
        )
        .limit(1);
      if (open?.invoice.couponId === (coupon?.id ?? null)) return open.invoice;
      if (open)
        await tx
          .update(serviceInvoices)
          .set({ status: 'FAILED' })
          .where(eq(serviceInvoices.id, open.invoice.id));

      const amountSatang = booking.priceSatang - (coupon?.discountSatang ?? 0);
      const [created] = await tx
        .insert(serviceInvoices)
        .values({
          amountSatang,
          platformFeeSatang: Math.round(
            PaymentConfig.invoice.platformFeeFraction * amountSatang,
          ),
          couponId: coupon?.id ?? null,
          discountSatang: coupon?.discountSatang ?? 0,
          status: 'PENDING',
        })
        .returning();
      await tx.insert(serviceAppointmentsOnInvoice).values({
        serviceAppointmentId: booking.id,
        serviceInvoiceId: created.id,
      });
      return created;
    });

    return {
      id: invoice.id,
      amountSatang: invoice.amountSatang,
      createdAt: invoice.createdAt,
      platformFeeSatang: invoice.platformFeeSatang,
      status: invoice.status,
    };
  }

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

  /**
   * Reads where an invoice's charge stands and, the first time its outcome is known, records it.
   * Checkout clears `paidAt` for every new charge, so recording only into an empty `paidAt` keeps
   * the first moment when the outcome is read again. A paid charge is money the platform now holds
   * until the session is done, and the bookings it pays for are booked (`confirmPayment` is
   * idempotent, so a second read moves and notifies nothing twice); a declined or expired one ends
   * this invoice, and the next attempt gets a new one.
   */
  private async settleCharge(invoice: {
    id: string;
    providerChargeId: string;
    paidAt: Date | null;
  }): Promise<ChargeStatus['status']> {
    const chargeResult = await this.paymentProvider.getChargeStatus(
      invoice.providerChargeId,
    );
    if (chargeResult.status !== 'pending' && !invoice.paidAt)
      await this.serviceInvoiceRepository.updateById(invoice.id, {
        ...chargedCard(chargeResult),
        paidAt: new Date(),
        status: chargeResult.status === 'success' ? 'HELD_IN_ESCROW' : 'FAILED',
      });
    if (chargeResult.status === 'success') {
      const appointmentIds =
        await this.serviceInvoiceRepository.findAppointmentIds(invoice.id);
      await Promise.all(
        appointmentIds.map((appointmentId) =>
          this.bookings.confirmPayment(appointmentId),
        ),
      );
    }
    return chargeResult.status;
  }

  /** Where checkout goes once a charge's outcome is known: the frontend's page for it. */
  private outcomeUrl(
    status: ChargeStatus['status'],
    invoiceId: string,
  ): string {
    return `${this.config.get(ENV_KEYS.FRONTEND_URL)}${PaymentConfig.checkoutCallback.redirectPaths[status]}?invoiceId=${invoiceId}`;
  }

  /** The 3-D Secure return, which is where a card charge's outcome is first known. */
  async paymentCallback(user: SessionUser, id: string) {
    const invoice = await this.serviceInvoiceRepository.findById(id);

    if (!invoice?.providerChargeId)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);

    const status = await this.settleCharge({
      ...invoice,
      providerChargeId: invoice.providerChargeId,
    });
    return { url: this.outcomeUrl(status, invoice.id) };
  }

  /**
   * Pays an invoice by PromptPay: a QR code the Advisee scans with their banking app, which
   * expires after `PaymentConfig.promptPay.expiresMinutes`. Each call is a new charge with a new
   * code, so an expired one is replaced by asking again; the invoice keeps only the latest, and
   * its `paidAt` is cleared for the outcome to fill.
   */
  async payByPromptPay(
    user: SessionUser,
    dto: PromptPayDto,
  ): Promise<PromptPayResponse> {
    const invoice = await this.serviceInvoiceRepository.findPublicById(
      dto.invoiceId,
      user.id,
    );
    if (!invoice)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);
    if (invoice.status !== 'PENDING')
      throw new BadRequestException(PaymentConfig.messages.invoiceNotPayable);

    const expiresAt = new Date(
      Date.now() + PaymentConfig.promptPay.expiresMinutes * 60_000,
    );
    const charge = await this.paymentProvider.chargePromptPay(
      invoice.amountSatang,
      expiresAt,
    );
    if (charge.status === 'failed')
      throw new InternalServerErrorException(charge);

    await this.serviceInvoiceRepository.updateById(invoice.id, {
      providerChargeId: charge.chargeId,
      cardBrand: PROMPTPAY_BRAND,
      cardLastDigits: null,
      paidAt: null,
    });
    return {
      qrImageUrl: charge.qrImageUrl,
      amountSatang: invoice.amountSatang,
      expiresAt: charge.expiresAt,
    };
  }

  /**
   * Pays an invoice in a Thai bank's app: the charge is made on the bank's source and the answer
   * is the page that opens the app. The bank returns the payer to the same return as a card's
   * 3-D Secure (`paymentCallback`), which records the outcome; until then the invoice keeps the
   * charge, named by the app, with `paidAt` cleared.
   */
  async payByMobileBanking(
    user: SessionUser,
    dto: MobileBankingDto,
  ): Promise<{ url: string }> {
    const invoice = await this.serviceInvoiceRepository.findPublicById(
      dto.invoiceId,
      user.id,
    );
    if (!invoice)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);
    if (invoice.status !== 'PENDING')
      throw new BadRequestException(PaymentConfig.messages.invoiceNotPayable);

    const charge = await this.paymentProvider.chargeMobileBanking(
      invoice.amountSatang,
      dto.bank,
      dto.platform,
      this.returnUrl(invoice.id),
    );
    if (charge.status === 'failed')
      throw new InternalServerErrorException(charge);

    await this.serviceInvoiceRepository.updateById(invoice.id, {
      providerChargeId: charge.chargeId,
      cardBrand: MOBILE_BANKS[dto.bank],
      cardLastDigits: null,
      paidAt: null,
    });
    return { url: charge.authorizeUri };
  }

  /** Where the provider sends the payer back once a card's bank or a bank's app is done. */
  private returnUrl(invoiceId: string): string {
    return `${this.config.get(ENV_KEYS.BACKEND_PUBLIC_URL)}${PaymentConfig.checkout.redirectPaths.callback}/${invoiceId}`;
  }

  /**
   * Whether an Advisee's PromptPay code has been paid, for the page showing it to ask until it
   * has. The first answer with an outcome records it and books the bookings, as the card's return
   * does; `url` is then where checkout goes.
   */
  async promptPayStatus(
    user: SessionUser,
    invoiceId: string,
  ): Promise<PromptPayStatusResponse> {
    const owned = await this.serviceInvoiceRepository.findPublicById(
      invoiceId,
      user.id,
    );
    const invoice = owned
      ? await this.serviceInvoiceRepository.findById(invoiceId)
      : undefined;
    if (!invoice?.providerChargeId)
      throw new NotFoundException(PaymentConfig.messages.crudInvoice.notFound);

    const status = await this.settleCharge({
      ...invoice,
      providerChargeId: invoice.providerChargeId,
    });
    return {
      status,
      url: status === 'pending' ? null : this.outcomeUrl(status, invoice.id),
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
    const redirectUrl = this.returnUrl(invoice.id);
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
