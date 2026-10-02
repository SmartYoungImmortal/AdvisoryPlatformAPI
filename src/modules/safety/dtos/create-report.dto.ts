import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Trim } from '@/common/decorators/trim.decorator';

/**
 * What a signed-in user may say when filing a report.
 *
 * There is deliberately no `reporterUserId` here. The reporter is taken from the session in
 * `ReportsService.submit`, because a reporter id accepted from the client would let anyone
 * file a report as somebody else — and with the global `forbidNonWhitelisted` pipe, a body
 * that tries to send one is rejected with a 400 rather than quietly ignored.
 */
export class CreateReportDto {
  @ApiProperty({ format: 'uuid', description: 'The account being reported' })
  @IsUUID()
  reportedUserId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'The chat room the report is about. The reporter must be a member of it.',
  })
  @IsOptional()
  @IsUUID()
  chatRoomId?: string;

  @ApiProperty({ maxLength: 2000 })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;
}
