import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  IsString,
  IsDateString,
} from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @IsArray()
  @IsDateString({ strict: true }, { each: true })
  startTimes!: string[];

  @IsString()
  @IsNotEmpty()
  cardToken!: string;
}
