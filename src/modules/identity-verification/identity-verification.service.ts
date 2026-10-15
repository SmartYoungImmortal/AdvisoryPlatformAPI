import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { IdentityVerificationQueryDto } from './dtos/identity-verification-query.dto';
import { IdentityVerificationResponseDto } from './dtos/identity-verification-response.dto';
import { OwnIdentityVerificationResponseDto } from './dtos/own-identity-verification-response.dto';
import { RejectIdentityVerificationDto } from './dtos/reject-identity-verification.dto';
import {
  DECIDABLE_IDENTITY_STATUSES,
  IDENTITY_VERIFICATION_MESSAGES,
  isTerminalIdentityStatus,
} from './identity-verification.constants';
import {
  IdentityVerificationRepository,
  type IdentityDecision,
} from './identity-verification.repository';

@Injectable()
export class IdentityVerificationService {
  constructor(private readonly repository: IdentityVerificationRepository) {}

  findManyForAdmin(
    query: IdentityVerificationQueryDto,
  ): Promise<PaginatedResult<IdentityVerificationResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.repository.findManyForAdmin(query, options),
      () => this.repository.countForAdmin(query),
      (row) => new IdentityVerificationResponseDto(row),
    );
  }

  async findOneForAdmin(
    advisorId: string,
  ): Promise<IdentityVerificationResponseDto> {
    const row = await this.repository.findOneForAdmin(advisorId);
    if (!row) {
      throw new NotFoundException(IDENTITY_VERIFICATION_MESSAGES.notFound);
    }
    return new IdentityVerificationResponseDto(row);
  }

  /**
   * The Advisor's own record. An Advisor who has never submitted has no row at all —
   * that is a 404 rather than a synthesized `NONE`, the same way `GET /advisors/me`
   * answers for a user who is not an Advisor.
   */
  async getOwn(user: SessionUser): Promise<OwnIdentityVerificationResponseDto> {
    const row = await this.repository.findOwn(user.id);
    if (!row) {
      throw new NotFoundException(IDENTITY_VERIFICATION_MESSAGES.notFound);
    }
    return new OwnIdentityVerificationResponseDto(row);
  }

  approve(
    admin: SessionUser,
    advisorId: string,
  ): Promise<IdentityVerificationResponseDto> {
    return this.decide(advisorId, {
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedByAdminId: admin.id,
      // A verified record carrying the reason it was once rejected is a response no
      // screen can render sensibly, so the ruling clears it.
      rejectionReason: null,
    });
  }

  reject(
    admin: SessionUser,
    advisorId: string,
    dto: RejectIdentityVerificationDto,
  ): Promise<IdentityVerificationResponseDto> {
    return this.decide(advisorId, {
      verificationStatus: 'REJECTED',
      rejectionReason: dto.reason,
      verifiedByAdminId: admin.id,
      // Nothing was verified, so there is no verification time. `advisor_identity` has
      // no separate `decidedAt`, so a rejection's timestamp is not recorded anywhere —
      // the reviewer and the reason are.
      verifiedAt: null,
    });
  }

  /**
   * A ruling is a conditional update against the statuses that still accept one, so
   * two admins deciding at the same moment cannot both succeed. The loser is told
   * apart from a caller naming a record that does not exist by reading the row back.
   *
   * The decided record is then re-read through the admin select, so approve, reject
   * and the queue all answer in one shape.
   */
  private async decide(
    advisorId: string,
    decision: IdentityDecision,
  ): Promise<IdentityVerificationResponseDto> {
    const decided = await this.repository.decide(
      advisorId,
      DECIDABLE_IDENTITY_STATUSES,
      decision,
    );
    if (!decided) {
      throw await this.refusal(advisorId);
    }
    return this.findOneForAdmin(advisorId);
  }

  private async refusal(
    advisorId: string,
  ): Promise<ConflictException | NotFoundException> {
    const current = await this.repository.findOwn(advisorId);
    if (!current) {
      return new NotFoundException(IDENTITY_VERIFICATION_MESSAGES.notFound);
    }
    return new ConflictException(
      isTerminalIdentityStatus(current.verificationStatus)
        ? IDENTITY_VERIFICATION_MESSAGES.alreadyDecided
        : IDENTITY_VERIFICATION_MESSAGES.notSubmitted,
    );
  }
}
