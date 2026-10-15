import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import { AdminPayoutDetailResponseDto } from './dtos/admin-payout-detail-response.dto';
import { AdminPayoutQueryDto } from './dtos/admin-payout-query.dto';
import { AdminPayoutResponseDto } from './dtos/admin-payout-response.dto';
import { MarkPayoutPaidDto } from './dtos/mark-payout-paid.dto';
import { PAYOUT_MESSAGES } from './payouts.constants';
import { PayoutsService } from './payouts.service';

/**
 * The Admin payout queue. `decide` rather than `update` on the two settlements: marking a transfer
 * paid or failed is one irreversible ruling about money that has or has not moved.
 */
@ApiTags('Admin payouts')
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @UserHasPermission({ permission: { payout: ['read'] } })
  @Get()
  @ApiGetPaginated(AdminPayoutResponseDto, { name: 'Payout' })
  findMany(
    @Query() query: AdminPayoutQueryDto,
  ): Promise<PaginatedResult<AdminPayoutResponseDto>> {
    return this.payouts.findManyForAdmin(query);
  }

  @UserHasPermission({ permission: { payout: ['read'] } })
  @Get(':payoutId')
  @ApiGetOne(AdminPayoutDetailResponseDto, { name: 'Payout' })
  findOne(
    @Param('payoutId', ParseUUIDPipe) payoutId: string,
  ): Promise<AdminPayoutDetailResponseDto> {
    return this.payouts.findOneForAdmin(payoutId);
  }

  @UserHasPermission({ permission: { payout: ['decide'] } })
  @Post(':payoutId/mark-paid')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(PAYOUT_MESSAGES.markedPaid)
  @ApiUpdate(AdminPayoutResponseDto, { name: 'Payout' })
  markPaid(
    @Param('payoutId', ParseUUIDPipe) payoutId: string,
    @Body() dto: MarkPayoutPaidDto,
  ): Promise<AdminPayoutResponseDto> {
    return this.payouts.markPaid(payoutId, dto);
  }

  /** No body: `payouts` has no column for a failure reason, and this module does not add one. */
  @UserHasPermission({ permission: { payout: ['decide'] } })
  @Post(':payoutId/mark-failed')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(PAYOUT_MESSAGES.markedFailed)
  @ApiUpdate(AdminPayoutResponseDto, { name: 'Payout' })
  markFailed(
    @Param('payoutId', ParseUUIDPipe) payoutId: string,
  ): Promise<AdminPayoutResponseDto> {
    return this.payouts.markFailed(payoutId);
  }
}
