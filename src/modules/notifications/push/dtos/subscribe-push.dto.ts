import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** The `keys` of a browser `PushSubscription.toJSON()`. */
export class PushKeysDto {
  @ApiProperty({ description: 'Base64url public key of the subscription' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  p256dh!: string;

  @ApiProperty({ description: 'Base64url auth secret of the subscription' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  auth!: string;
}

/** The body is exactly what the browser's `PushSubscription.toJSON()` returns. */
export class SubscribePushDto {
  @ApiProperty({ description: 'Push service URL for this browser' })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  endpoint!: string;

  @ApiProperty({ type: PushKeysDto })
  @ValidateNested()
  @Type(() => PushKeysDto)
  keys!: PushKeysDto;

  /** Sent by browsers in `toJSON()`; accepted so that body validates, not stored. */
  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsNumber()
  expirationTime?: number | null;
}
