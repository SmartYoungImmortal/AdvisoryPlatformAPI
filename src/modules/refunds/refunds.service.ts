import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AdminRefundCaseDetailResponseDto } from './dtos/admin-refund-case-detail-response.dto';
import { AdminRefundCaseQueryDto } from './dtos/admin-refund-case-query.dto';
import { AdminRefundCaseResponseDto } from './dtos/admin-refund-case-response.dto';
import { CreateRefundCaseDto } from './dtos/create-refund-case.dto';
import { RefundCaseResponseDto } from './dtos/refund-case-response.dto';
import { RejectRefundCaseDto } from './dtos/reject-refund-case.dto';
import { REFUND_CASE_OPEN_STATUS, REFUND_MESSAGES } from './refunds.constants';
import { RefundsRepository } from './refunds.repository';
import type { RefundCaseStatus } from './refunds.types';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(private readonly repository: RefundsRepository) {}

  /**
   * An Advisee opening a case against their own payment.
   *
   * The invoice is resolved through its appointment's Advisee before anything is written, because
   * trusting the body's `invoiceId` alone would let one person dispute a stranger's payment. An
   * invoice the caller has no claim on is a 404, identical to one that does not exist.
   */
  async open(
    user: SessionUser,
    dto: CreateRefundCaseDto,
  ): Promise<RefundCaseResponseDto> {
    const invoice = await this.repository.findDisputableInvoice(
      dto.invoiceId,
      user.id,
    );
    if (!invoice) {
      throw new NotFoundException(REFUND_MESSAGES.invoiceNotFound);
    }

    const alreadyOpen = await this.repository.openCaseExists(invoice.id);
    if (alreadyOpen) {
      throw new ConflictException(REFUND_MESSAGES.alreadyOpen);
    }

    const refundCase = await this.repository.create({
      invoiceId: invoice.id,
      requestedByUserId: user.id,
      reason: dto.reason,
    });
    return new RefundCaseResponseDto(refundCase);
  }

  findMine(
    user: SessionUser,
    page: OffsetPaginationDto,
  ): Promise<PaginatedResult<RefundCaseResponseDto>> {
    return paginateQuery(
      page,
      (options) => this.repository.findManyForRequester(user.id, options),
      () => this.repository.countForRequester(user.id),
      (refundCase) => new RefundCaseResponseDto(refundCase),
    );
  }

  findManyForAdmin(
    query: AdminRefundCaseQueryDto,
  ): Promise<PaginatedResult<AdminRefundCaseResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.repository.findManyForAdmin(query.status, options),
      () => this.repository.countForAdmin(query.status),
      (row) => new AdminRefundCaseResponseDto(row),
    );
  }

  async findOneForAdmin(
    refundCaseId: string,
  ): Promise<AdminRefundCaseDetailResponseDto> {
    const [row, evidence] = await Promise.all([
      this.repository.findOneForAdmin(refundCaseId),
      this.repository.findEvidence(refundCaseId),
    ]);
    if (!row) {
      throw new NotFoundException(REFUND_MESSAGES.notFound);
    }
    return new AdminRefundCaseDetailResponseDto(row, evidence);
  }

  approve(
    admin: SessionUser,
    refundCaseId: string,
  ): Promise<AdminRefundCaseResponseDto> {
    return this.rule(admin, refundCaseId, 'APPROVED');
  }

  /**
   * Refusing a case. The DTO requires written reasoning, but `refund_cases` has nowhere to keep
   * it: `reason` holds the requester's own words and is not the Admin's to overwrite, and adding a
   * column is the schema owner's call, not this module's. So the ruling note is recorded in the
   * service log and explicitly not persisted — a gap to close with a `resolutionNote` column
   * rather than to paper over here.
   */
  async reject(
    admin: SessionUser,
    refundCaseId: string,
    dto: RejectRefundCaseDto,
  ): Promise<AdminRefundCaseResponseDto> {
    const ruled = await this.rule(admin, refundCaseId, 'REJECTED');
    this.logger.warn(
      `Refund case ${refundCaseId} rejected by admin ${admin.id}. refund_cases has no column for the ruling note, so it was not stored: ${dto.reason}`,
    );
    return ruled;
  }

  /**
   * One ruling, once. The case is read first so that a case nobody can find is a 404 while a case
   * somebody already decided is a 409, and the write itself is still conditional on the case being
   * open — otherwise two Admins ruling at the same moment would both succeed and the second would
   * overwrite who decided it and when.
   */
  private async rule(
    admin: SessionUser,
    refundCaseId: string,
    status: RefundCaseStatus,
  ): Promise<AdminRefundCaseResponseDto> {
    const current = await this.repository.findById(refundCaseId);
    if (!current) {
      throw new NotFoundException(REFUND_MESSAGES.notFound);
    }
    if (current.status !== REFUND_CASE_OPEN_STATUS) {
      throw new ConflictException(REFUND_MESSAGES.alreadyResolved);
    }

    const ruled = await this.repository.ruleOpenCase(refundCaseId, {
      status,
      reviewedByAdminId: admin.id,
      resolvedAt: new Date(),
    });
    if (!ruled) {
      throw new ConflictException(REFUND_MESSAGES.alreadyResolved);
    }

    const row = await this.repository.findOneForAdmin(refundCaseId);
    if (!row) {
      throw new NotFoundException(REFUND_MESSAGES.notFound);
    }
    return new AdminRefundCaseResponseDto(row);
  }
}
