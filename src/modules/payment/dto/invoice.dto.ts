import { ChargeStatus } from '@/modules/payment/providers/providers';
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

export class PaymentStatusDto {
  appointments!: PaymentStatusAppointments[];
  invoice!: PaymentStatusInvoice;
  service!: PaymentStatusService;
  chargeStatus!: ChargeStatus;
}
