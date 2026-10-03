import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Redirect,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  CheckoutDto,
  CheckoutResponse,
} from '@/modules/payment/dto/checkout.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { CreateInvoiceDto } from '@/modules/payment/dto/invoice.dto';
import { InvoiceDto } from '@/modules/payment/dto/invoice.dto';
import { ApiCreate, ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { ApiSeeOtherResponse } from '@nestjs/swagger';
import type { Response } from 'express';

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
