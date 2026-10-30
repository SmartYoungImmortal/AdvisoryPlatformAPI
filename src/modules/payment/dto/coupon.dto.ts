import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** A coupon tried against a booking before paying: what it would take off. */
export class CouponPreviewDto {
  @ApiProperty()
  @IsUUID()
  bookingId!: string;

  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code!: string;
}

/** The booking's price with the coupon taken off, in satang. */
export class CouponPreviewResponse {
  @ApiProperty() code!: string;
  @ApiProperty() priceSatang!: number;
  @ApiProperty() discountSatang!: number;
  @ApiProperty() amountSatang!: number;
}

/** The booking's invoice, with the coupon the Advisee added at checkout, if any. */
export class BookingInvoiceDto {
  @ApiPropertyOptional({ example: 'WELCOME10' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  couponCode?: string;
}
