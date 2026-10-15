import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiCreate,
  ApiGetPaginated,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
  OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { CreateRefundCaseDto } from './dtos/create-refund-case.dto';
import { RefundCaseResponseDto } from './dtos/refund-case-response.dto';
import { REFUND_MESSAGES } from './refunds.constants';
import { RefundsService } from './refunds.service';

/** The Advisee's side of a refund: raise a case against an invoice you paid, and watch it. */
@ApiTags('Refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refunds: RefundsService) {}

  @UserHasPermission({ permission: { refund: ['submitSelf'] } })
  @Post()
  @ResponseMessage(REFUND_MESSAGES.opened)
  @ApiCreate(RefundCaseResponseDto, { name: 'Refund case' })
  open(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateRefundCaseDto,
  ): Promise<RefundCaseResponseDto> {
    return this.refunds.open(user, dto);
  }

  @UserHasPermission({ permission: { refund: ['readSelf'] } })
  @Get('me')
  @ApiGetPaginated(RefundCaseResponseDto, { name: 'Refund case' })
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<RefundCaseResponseDto>> {
    return this.refunds.findMine(user, query);
  }
}
