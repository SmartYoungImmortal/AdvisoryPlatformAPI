import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CheckoutDto } from '@/modules/payment/dto/checkout.dto';
import { SessionUser } from '@/modules/auth/auth.config';
import { service as serviceMock } from '@/mock/services';
import { invoicePending } from '@/mock/invoices';
import { IPaymentProvider } from '@/modules/payment/providers/interface';

@Injectable()
export class PaymentService {
  constructor(private readonly paymentProvider: IPaymentProvider) {}

  async checkout(user: SessionUser, dto: CheckoutDto) {
    // get price
    // TODO: replace
    const service = serviceMock;
    // create service appopintment
    // const appointment = appointmentPendingPayment;
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
    // redirect to 3ds w/ redirect uri to service appopintment
    return { url: chargeResult.redirectUrl };
    // retrieve omise charge
    // update invoice
  }
}
