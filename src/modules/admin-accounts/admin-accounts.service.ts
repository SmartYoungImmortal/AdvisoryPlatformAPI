import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminAccountsRepository } from './admin-accounts.repository';
import {
  ACCOUNT_DELETED_STATUS,
  ACCOUNT_MESSAGES,
} from './admin-accounts.constants';
import { AccountQueryDto } from './dtos/account-query.dto';
import { AdminAccountDetailResponseDto } from './dtos/admin-account-detail-response.dto';
import { AdminAccountResponseDto } from './dtos/admin-account-response.dto';
import { SuspendAccountDto } from './dtos/suspend-account.dto';

@Injectable()
export class AdminAccountsService {
  constructor(private readonly accounts: AdminAccountsRepository) {}

  async findMany(
    query: AccountQueryDto,
  ): Promise<PaginatedResult<AdminAccountResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.accounts.findManyForAdmin(query, options),
      () => this.accounts.countForAdmin(query),
      (row) => new AdminAccountResponseDto(row),
    );
  }

  async findOne(userId: string): Promise<AdminAccountDetailResponseDto> {
    const row = await this.accounts.findDetailById(userId);
    if (!row) {
      throw new NotFoundException(ACCOUNT_MESSAGES.notFound);
    }
    return new AdminAccountDetailResponseDto(row);
  }

  /**
   * Suspends an account: `status`, `banned` and `ban_reason` in one statement.
   *
   * An admin may not suspend themselves. It is not paternalism — it is the one suspension
   * that cannot be undone from inside the console, because the moment the write lands the
   * session that would reverse it belongs to a banned account.
   */
  async suspend(
    admin: SessionUser,
    userId: string,
    dto: SuspendAccountDto,
  ): Promise<AdminAccountResponseDto> {
    if (userId === admin.id) {
      throw new BadRequestException(ACCOUNT_MESSAGES.selfSuspend);
    }

    const suspended = await this.accounts.suspendIfActive(userId, dto.reason);
    if (suspended) {
      return new AdminAccountResponseDto(suspended);
    }

    throw await this.explainRefusal(userId, ACCOUNT_MESSAGES.alreadySuspended);
  }

  /** Clears the suspension. Only a suspended account has one to clear. */
  async reinstate(userId: string): Promise<AdminAccountResponseDto> {
    const reinstated = await this.accounts.reinstateIfSuspended(userId);
    if (reinstated) {
      return new AdminAccountResponseDto(reinstated);
    }

    throw await this.explainRefusal(userId, ACCOUNT_MESSAGES.notSuspended);
  }

  /**
   * Why the conditional UPDATE matched nothing: no such account, an anonymised one, or a
   * status the transition does not apply to. Only runs on the failing path, and never
   * reports "already suspended" for a row that is actually gone.
   */
  private async explainRefusal(
    userId: string,
    wrongStatusMessage: string,
  ): Promise<NotFoundException | ConflictException> {
    const status = await this.accounts.findStatusById(userId);
    if (status === undefined) {
      return new NotFoundException(ACCOUNT_MESSAGES.notFound);
    }
    if (status === ACCOUNT_DELETED_STATUS) {
      return new ConflictException(ACCOUNT_MESSAGES.deletedAccount);
    }
    return new ConflictException(wrongStatusMessage);
  }
}
