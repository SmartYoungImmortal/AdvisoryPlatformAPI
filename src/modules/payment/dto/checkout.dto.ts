import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

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
