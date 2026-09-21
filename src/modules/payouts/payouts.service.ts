import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminPayoutDetailResponseDto } from './dtos/admin-payout-detail-response.dto';
import { AdminPayoutQueryDto } from './dtos/admin-payout-query.dto';
import { AdminPayoutResponseDto } from './dtos/admin-payout-response.dto';
import { MarkPayoutPaidDto } from './dtos/mark-payout-paid.dto';
import { PayoutResponseDto } from './dtos/payout-response.dto';
import { PAYOUT_MESSAGES, PAYOUT_PENDING_STATUS } from './payouts.constants';
import { PayoutsRepository } from './payouts.repository';

@Injectable()
export class PayoutsService {
  constructor(private readonly repository: PayoutsRepository) {}

  findManyForAdmin(
    query: AdminPayoutQueryDto,
  ): Promise<PaginatedResult<AdminPayoutResponseDto>> {
    const filters = { status: query.status, advisorId: query.advisorId };
    return paginateQuery(
      query,
      (options) => this.repository.findManyForAdmin(filters, options),
      () => this.repository.countForAdmin(filters),
      (row) => new AdminPayoutResponseDto(row),
    );
  }

  async findOneForAdmin(
    payoutId: string,
  ): Promise<AdminPayoutDetailResponseDto> {
    const [row, invoices] = await Promise.all([
      this.repository.findOneForAdmin(payoutId),
      this.repository.findInvoices(payoutId),
    ]);
    if (!row) {
      throw new NotFoundException(PAYOUT_MESSAGES.notFound);
    }
    return new AdminPayoutDetailResponseDto(row, invoices);
  }

  findMine(
    user: SessionUser,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<PayoutResponseDto>> {
    return paginateQuery(
      page,
      (options) => this.repository.findManyForAdvisor(user.id, options),
      () => this.repository.countForAdvisor(user.id),
      (payout) => new PayoutResponseDto(payout),
    );
  }

  /**
   * The transfer went out. `providerTransferId` is only written when the body carries one, so
   * reconciling a payout without the provider reference to hand does not erase a reference that is
   * already on the row.
   */
  markPaid(
    payoutId: string,
    dto: MarkPayoutPaidDto,
  ): Promise<AdminPayoutResponseDto> {
    return this.settle(payoutId, {
      status: 'PAID',
      paidAt: new Date(),
      ...(dto.providerTransferId === undefined
        ? {}
        : { providerTransferId: dto.providerTransferId }),
    });
  }

  /**
   * The transfer did not go out. `paidAt` stays null — it records when money actually moved, and a
   * failed payout never moved any.
   *
   * There is no `reason` on this route: `payouts` has no column for a failure note, and inventing
   * one is the schema owner's call rather than this module's. See the handoff note in the report.
   */
  markFailed(payoutId: string): Promise<AdminPayoutResponseDto> {
    return this.settle(payoutId, { status: 'FAILED' });
  }

  /**
   * One ruling, once. The payout is read first so that a payout nobody can find is a 404 while one
   * already `PAID` or `FAILED` is a 409, and the write stays conditional on it still being pending
   * — otherwise two Admins settling the same payout at the same moment would both succeed and the
   * second would rewrite `paidAt` and the transfer id of a transfer that already happened.
   */
  private async settle(
    payoutId: string,
    values: {
      status: 'PAID' | 'FAILED';
      paidAt?: Date;
      providerTransferId?: string;
    },
  ): Promise<AdminPayoutResponseDto> {
    const current = await this.repository.findById(payoutId);
    if (!current) {
      throw new NotFoundException(PAYOUT_MESSAGES.notFound);
    }
    if (current.status !== PAYOUT_PENDING_STATUS) {
      throw new ConflictException(PAYOUT_MESSAGES.alreadySettled);
    }

    const settled = await this.repository.settlePendingPayout(payoutId, values);
    if (!settled) {
      throw new ConflictException(PAYOUT_MESSAGES.alreadySettled);
    }

    const row = await this.repository.findOneForAdmin(payoutId);
    if (!row) {
      throw new NotFoundException(PAYOUT_MESSAGES.notFound);
    }
    return new AdminPayoutResponseDto(row);
  }
}
