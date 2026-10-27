import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CheckoutDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  invoiceId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardToken!: string;
}

export class CheckoutResponse {
  @ApiProperty()
  @IsUrl()
  url!: string;
}
