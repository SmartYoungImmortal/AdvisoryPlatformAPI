import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';

export class MyRefundCaseQueryDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}
