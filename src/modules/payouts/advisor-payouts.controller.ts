import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiGetPaginated } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { PayoutResponseDto } from './dtos/payout-response.dto';
import { PayoutsService } from './payouts.service';

/**
 * The Advisor's own payout statement. The path is the literal `advisors/me/payouts`, so it never
 * competes with `advisors/:advisorId/...`; `readSelf` is the only payout verb an Advisor holds,
 * and the query is keyed on the session user rather than on anything in the request.
 */
@ApiTags('Payouts')
@Controller('advisors/me/payouts')
export class AdvisorPayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @UserHasPermission({ permission: { payout: ['readSelf'] } })
  @Get()
  @ApiGetPaginated(PayoutResponseDto, { name: 'Payout' })
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<PayoutResponseDto>> {
    return this.payouts.findMine(user, query);
  }
}
