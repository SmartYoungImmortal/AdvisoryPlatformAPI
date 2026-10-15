import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';
import { MAX_POLICY_VERSION_LENGTH } from '../pdpa.constants';

export class CreatePdpaConsentDto {
  @ApiProperty({ maxLength: MAX_POLICY_VERSION_LENGTH, example: '2026-09-01' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_POLICY_VERSION_LENGTH)
  policyVersion!: string;
}
