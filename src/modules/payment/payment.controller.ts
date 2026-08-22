import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import type { SessionUser } from '@/modules/auth/auth.config';

@Controller('api/v1/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // @Post()
  // create(@Body() createPaymentDto: CreatePaymentDto) {
  //   return this.paymentService.create(createPaymentDto);
  // }

  // @Get()
  // findAll() {
  //   return this.paymentService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.paymentService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
  //   return this.paymentService.update(+id, updatePaymentDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.paymentService.remove(+id);
  // }

  @Post('checkout')
  async checkout(@CurrentUser() user: SessionUser, @Body() dto: CheckoutDto) {
    return await this.paymentService.checkout(user, dto);
  }
}
