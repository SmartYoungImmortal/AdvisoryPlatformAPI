import { IsUUID, IsNotEmpty, IsArray, IsDateString } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @IsArray()
  @IsDateString({ strict: true }, { each: true })
  startTimes!: string[];
}

export class InvoiceDto {
  id!: string;
  createdAt!: Date;
  status!: 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';
  amountSatang!: number;
  platformFeeSatang!: number;
}

export class PaymentStatusAppointments {
  startTime!: Date;
  endTime!: Date;
}

export class PaymentStatusInvoice {
  id!: string;
  amountSatang!: number;
  createdAt!: Date;
  platformFeeSatang!: number;
  status!: 'PENDING' | 'HELD_IN_ESCROW' | 'RELEASED' | 'REFUNDED' | 'FAILED';
}

export class PaymentStatusService {
  advisorFullName!: string;
  name!: string;
}

export type ChargeStatusDto =
  | {
      status: 'pending';
    }
  | {
      status: 'success';
      brand: string;
      lastDigits: string;
      redirectUrl: string;
    }
  | {
      status: 'failed';
      brand: string;
      lastDigits: string;
      errorCode:
        | 'confirmed_amount_mismatch'
        | 'failed_fraud_check'
        | 'failed_processing'
        | 'insufficient_balance/insufficient_fund'
        | 'invalid_account_number/invalid_account'
        | 'insufficient_balance'
        | 'insufficient_fund'
        | 'invalid_account_number'
        | 'invalid_account'
        | 'payment_cancelled'
        | 'payment_rejected'
        | 'expired_card'
        | 'stolen_or_lost_card'
        | 'timeout'
        | 'unspecified';
      message: string;
    };

export class PaymentStatusDto {
  appointments!: PaymentStatusAppointments[];
  invoice!: PaymentStatusInvoice;
  service!: PaymentStatusService;
  chargeStatus!: ChargeStatusDto;
}
