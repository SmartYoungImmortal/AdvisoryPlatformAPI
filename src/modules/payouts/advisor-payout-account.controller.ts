import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiDelete,
  ApiGetOne,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { PayoutAccountResponseDto } from './dtos/payout-account-response.dto';
import { SavePayoutAccountDto } from './dtos/save-payout-account.dto';
import { PayoutAccountService } from './payout-account.service';
import { PAYOUT_ACCOUNT_MESSAGES } from './payouts.constants';

/**
 * The account the Advisor's payouts go to: read it, save a new one in its place, or remove it. A
 * literal `advisors/me/...` path keyed on the session user, as the payout statement is; 404 while
 * the Advisor has none.
 */
@ApiTags('Payouts')
@Controller('advisors/me/payout-account')
export class AdvisorPayoutAccountController {
  constructor(private readonly accounts: PayoutAccountService) {}

  @UserHasPermission({ permission: { payout: ['readSelf'] } })
  @Get()
  @ApiGetOne(PayoutAccountResponseDto, { name: 'Payout account' })
  findMine(
    @CurrentUser() user: SessionUser,
  ): Promise<PayoutAccountResponseDto> {
    return this.accounts.findMine(user);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Put()
  @ResponseMessage(PAYOUT_ACCOUNT_MESSAGES.saved)
  @ApiUpdate(PayoutAccountResponseDto, { name: 'Payout account' })
  save(
    @CurrentUser() user: SessionUser,
    @Body() dto: SavePayoutAccountDto,
  ): Promise<PayoutAccountResponseDto> {
    return this.accounts.save(user, dto);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(PAYOUT_ACCOUNT_MESSAGES.deleted)
  @ApiDelete(PayoutAccountResponseDto, { name: 'Payout account' })
  remove(@CurrentUser() user: SessionUser): Promise<void> {
    return this.accounts.remove(user);
  }
}
