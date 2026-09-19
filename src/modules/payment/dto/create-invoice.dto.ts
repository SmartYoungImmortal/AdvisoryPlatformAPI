import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsArray,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty()
  @IsArray()
  @IsDateString({ strict: true }, { each: true })
  startTimes!: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cardToken!: string;
}
