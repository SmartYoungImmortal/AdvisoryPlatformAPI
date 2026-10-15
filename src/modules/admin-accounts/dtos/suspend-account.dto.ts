import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

/**
 * Why an account is being suspended. Required, because the reason is written to
 * `user.ban_reason` and is the only record of why access was taken away — a suspension
 * nobody can explain later is worse than no suspension.
 */
export class SuspendAccountDto {
  @ApiProperty({ maxLength: 500 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
