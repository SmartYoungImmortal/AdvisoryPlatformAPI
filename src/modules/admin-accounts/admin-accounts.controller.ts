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
import { AdminAccountsService } from './admin-accounts.service';
import { ACCOUNT_MESSAGES } from './admin-accounts.constants';
import { AccountQueryDto } from './dtos/account-query.dto';
import { AdminAccountDetailResponseDto } from './dtos/admin-account-detail-response.dto';
import { AdminAccountResponseDto } from './dtos/admin-account-response.dto';
import { SuspendAccountDto } from './dtos/suspend-account.dto';

/**
 * The admin console's view of user accounts.
 *
 * Permissions come from the better-auth admin plugin's own `user` statements — `list`, `get`
 * and `ban` — rather than a new resource invented here, so the console's access to accounts is
 * governed by the same vocabulary `/api/auth/admin/*` is.
 *
 * The plugin already ships `list-users`, `get-user`, `ban-user` and `unban-user` under
 * `/api/auth/admin/*`. These routes are not a second copy of them:
 *
 * - The two reads exist because the plugin's `list-users` cannot join this platform's own
 *   tables or filter on our `status` column, and the console's list needs both.
 * - The two writes exist because `status` is ours and better-auth does not know it. A ban
 *   placed through `/api/auth/admin/ban-user` leaves `status = 'ACTIVE'`, so an account would
 *   read as active in every query that filters on `status` while being unable to sign in.
 *   Suspension has to write both columns in one statement, and only this module can.
 *
 * Consequently the console should not call `ban-user` / `unban-user` directly. Everything the
 * plugin does that has no `status` half — `set-role`, `create-user`, sessions, impersonation,
 * password and email changes — stays with the plugin and is deliberately absent here.
 */
@ApiTags('Admin accounts')
@Controller('admin/accounts')
export class AdminAccountsController {
  constructor(private readonly accounts: AdminAccountsService) {}

  @UserHasPermission({ permission: { user: ['list'] } })
  @Get()
  @ApiGetPaginated(AdminAccountResponseDto, { name: 'Account' })
  findMany(
    @Query() query: AccountQueryDto,
  ): Promise<PaginatedResult<AdminAccountResponseDto>> {
    return this.accounts.findMany(query);
  }

  @UserHasPermission({ permission: { user: ['get'] } })
  @Get(':userId')
  @ApiGetOne(AdminAccountDetailResponseDto, { name: 'Account' })
  findOne(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminAccountDetailResponseDto> {
    return this.accounts.findOne(userId);
  }

  @UserHasPermission({ permission: { user: ['ban'] } })
  @Post(':userId/suspend')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ACCOUNT_MESSAGES.suspended)
  @ApiUpdate(AdminAccountResponseDto, { name: 'Account' })
  suspend(
    @CurrentUser() admin: SessionUser,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SuspendAccountDto,
  ): Promise<AdminAccountResponseDto> {
    return this.accounts.suspend(admin, userId, dto);
  }

  @UserHasPermission({ permission: { user: ['ban'] } })
  @Post(':userId/reinstate')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ACCOUNT_MESSAGES.reinstated)
  @ApiUpdate(AdminAccountResponseDto, { name: 'Account' })
  reinstate(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AdminAccountResponseDto> {
    return this.accounts.reinstate(userId);
  }
}
