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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminRefundCaseDetailResponseDto } from './dtos/admin-refund-case-detail-response.dto';
import { AdminRefundCaseQueryDto } from './dtos/admin-refund-case-query.dto';
import { AdminRefundCaseResponseDto } from './dtos/admin-refund-case-response.dto';
import { RejectRefundCaseDto } from './dtos/reject-refund-case.dto';
import { REFUND_MESSAGES } from './refunds.constants';
import { RefundsService } from './refunds.service';

/**
 * The Admin queue. `decide` rather than `update` on the two rulings: approving or refusing a
 * refund is one irreversible decision, and a role that can edit is not automatically one that
 * can rule.
 */
@ApiTags('Admin refunds')
@Controller('admin/refunds')
export class AdminRefundsController {
  constructor(private readonly refunds: RefundsService) {}

  @UserHasPermission({ permission: { refund: ['read'] } })
  @Get()
  @ApiGetPaginated(AdminRefundCaseResponseDto, { name: 'Refund case' })
  findMany(
    @Query() query: AdminRefundCaseQueryDto,
  ): Promise<PaginatedResult<AdminRefundCaseResponseDto>> {
    return this.refunds.findManyForAdmin(query);
  }

  @UserHasPermission({ permission: { refund: ['read'] } })
  @Get(':refundCaseId')
  @ApiGetOne(AdminRefundCaseDetailResponseDto, { name: 'Refund case' })
  findOne(
    @Param('refundCaseId', ParseUUIDPipe) refundCaseId: string,
  ): Promise<AdminRefundCaseDetailResponseDto> {
    return this.refunds.findOneForAdmin(refundCaseId);
  }

  @UserHasPermission({ permission: { refund: ['decide'] } })
  @Post(':refundCaseId/approve')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(REFUND_MESSAGES.approved)
  @ApiUpdate(AdminRefundCaseResponseDto, { name: 'Refund case' })
  approve(
    @CurrentUser() admin: SessionUser,
    @Param('refundCaseId', ParseUUIDPipe) refundCaseId: string,
  ): Promise<AdminRefundCaseResponseDto> {
    return this.refunds.approve(admin, refundCaseId);
  }

  @UserHasPermission({ permission: { refund: ['decide'] } })
  @Post(':refundCaseId/reject')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(REFUND_MESSAGES.rejected)
  @ApiUpdate(AdminRefundCaseResponseDto, { name: 'Refund case' })
  reject(
    @CurrentUser() admin: SessionUser,
    @Param('refundCaseId', ParseUUIDPipe) refundCaseId: string,
    @Body() dto: RejectRefundCaseDto,
  ): Promise<AdminRefundCaseResponseDto> {
    return this.refunds.reject(admin, refundCaseId, dto);
  }
}
