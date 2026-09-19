import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { Response } from 'express';
import { CreateInvoiceDto } from '@/modules/payment/dto/create-invoice.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  async postCheckout(
    @CurrentUser() user: SessionUser,
    @Body() dto: CheckoutDto,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.checkout(user, dto);

    return res.redirect(HttpStatus.SEE_OTHER, result.url);
  }

  @Post('invoice')
  async postInvoice(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateInvoiceDto,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.createInvoice(user, dto);

    return res.redirect(HttpStatus.SEE_OTHER, result.url);
  }
}
