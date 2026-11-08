import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Redirect,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import {
  CheckoutDto,
  CheckoutResponse,
} from '@/modules/payment/dto/checkout.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import {
  CreateInvoiceDto,
  PaymentStatusDto,
} from '@/modules/payment/dto/invoice.dto';
import { InvoiceDto } from '@/modules/payment/dto/invoice.dto';
import {
  BookingInvoiceDto,
  CouponPreviewDto,
  CouponPreviewResponse,
} from '@/modules/payment/dto/coupon.dto';
import {
  PromptPayDto,
  PromptPayResponse,
  PromptPayStatusResponse,
} from '@/modules/payment/dto/promptpay.dto';
import { MobileBankingDto } from '@/modules/payment/dto/mobile-banking.dto';
import {
  ApiCreate,
  ApiGetOne,
  ApiGetPaginated,
} from '@/common/decorators/api-docs.decorator';
import { ApiSeeOtherResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import { AdviseeInvoiceResponseDto } from '@/modules/payment/dto/advisee-invoice-response.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @ApiCreate(CheckoutResponse)
  async postCheckout(
    @CurrentUser() user: SessionUser,
    @Body() dto: CheckoutDto,
    // @Res() res: Response,
  ) {
    const result = await this.paymentService.checkout(user, dto);

    return result;
    // return res.redirect(HttpStatus.SEE_OTHER, result.url);
  }

  /** Pay an invoice by PromptPay: the QR code to scan, its amount, and when it expires. */
  @Post('promptpay')
  @ApiCreate(PromptPayResponse)
  postPromptPay(
    @CurrentUser() user: SessionUser,
    @Body() dto: PromptPayDto,
  ): Promise<PromptPayResponse> {
    return this.paymentService.payByPromptPay(user, dto);
  }

  /** Pay an invoice in a Thai bank's app: the page that opens the app. */
  @Post('mobile-banking')
  @ApiCreate(CheckoutResponse)
  postMobileBanking(
    @CurrentUser() user: SessionUser,
    @Body() dto: MobileBankingDto,
  ): Promise<CheckoutResponse> {
    return this.paymentService.payByMobileBanking(user, dto);
  }

  /** Whether the invoice's PromptPay code has been paid; asked until it has. */
  @Get('invoice/:id/promptpay-status')
  @ApiGetOne(PromptPayStatusResponse)
  getPromptPayStatus(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PromptPayStatusResponse> {
    return this.paymentService.promptPayStatus(user, id);
  }

  /** The Omise public key the browser tokenises a card with. Public: it is the key meant to be. */
  @Public()
  @Get('public-key')
  getPublicKey(): { publicKey: string } {
    return this.paymentService.publicKey();
  }

  /** The invoice for a booking `POST /bookings` holds, less its coupon: the one checkout charges. */
  @Post('invoice/for-booking/:bookingId')
  @ApiCreate(InvoiceDto)
  postBookingInvoice(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body() dto: BookingInvoiceDto,
  ): Promise<InvoiceDto> {
    return this.paymentService.createBookingInvoice(
      user,
      bookingId,
      dto.couponCode,
    );
  }

  /** What a coupon would take off a booking. 400 for any code that cannot be used. */
  @Post('coupons/preview')
  @ApiCreate(CouponPreviewResponse)
  previewCoupon(
    @CurrentUser() user: SessionUser,
    @Body() dto: CouponPreviewDto,
  ): Promise<CouponPreviewResponse> {
    return this.paymentService.previewCoupon(user, dto);
  }

  @Post('invoice')
  async postInvoice(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateInvoiceDto,
  ) {
    const result = await this.paymentService.createInvoice(user, dto);

    return result;
  }

  @Get('invoice/:id')
  @ApiGetOne(InvoiceDto)
  async getInvoice(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
  ): Promise<InvoiceDto> {
    return this.paymentService.getInvoiceById(user, id);
  }

  /** The signed-in user's transaction history as the Advisee, newest first, every status. */
  @Get('invoices')
  @ApiGetPaginated(AdviseeInvoiceResponseDto, { name: 'Invoice' })
  listMyInvoices(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<AdviseeInvoiceResponseDto>> {
    return this.paymentService.findMyInvoices(user, query);
  }

  /** The receipt linked to this user's booking, regardless of history pagination. */
  @Get('invoices/for-booking/:bookingId')
  @ApiGetOne(AdviseeInvoiceResponseDto, { name: 'Invoice' })
  getMyBookingInvoice(
    @CurrentUser() user: SessionUser,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ): Promise<AdviseeInvoiceResponseDto> {
    return this.paymentService.findMyBookingInvoice(user, bookingId);
  }

  /** One receipt from that history. Checkout keeps its own `invoice/:id` above. */
  @Get('invoices/:id')
  @ApiGetOne(AdviseeInvoiceResponseDto, { name: 'Invoice' })
  getMyInvoice(
    @CurrentUser() user: SessionUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdviseeInvoiceResponseDto> {
    return this.paymentService.findMyInvoice(user, id);
  }

  @Get('invoice/:id/paymentStatus')
  @ApiGetOne(PaymentStatusDto)
  async getPaymentStatus(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
  ): Promise<PaymentStatusDto> {
    return this.paymentService.getPaymentStatus(user, id);
  }

  @Get('callback/:id')
  @ApiSeeOtherResponse()
  @Redirect('http://localhost:4000', HttpStatus.SEE_OTHER)
  async checkoutCallback(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const { url } = await this.paymentService.paymentCallback(user, id);
    response.redirect(HttpStatus.SEE_OTHER, url);
  }
}
