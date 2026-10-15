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
import { OwnSkillProofResponseDto } from './dtos/own-skill-proof-response.dto';
import { RejectSkillProofDto } from './dtos/reject-skill-proof.dto';
import { SkillProofQueryDto } from './dtos/skill-proof-query.dto';
import { SkillProofResponseDto } from './dtos/skill-proof-response.dto';
import {
  DECIDABLE_SKILL_PROOF_STATUSES,
  SKILL_PROOF_MESSAGES,
} from './skill-proofs.constants';
import {
  SkillProofsRepository,
  type SkillProofReview,
} from './skill-proofs.repository';

@Injectable()
export class SkillProofsService {
  constructor(private readonly repository: SkillProofsRepository) {}

  findManyForAdmin(
    query: SkillProofQueryDto,
  ): Promise<PaginatedResult<SkillProofResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.repository.findManyForAdmin(query, options),
      () => this.repository.countForAdmin(query),
      (row) => new SkillProofResponseDto(row),
    );
  }

  async findOneForAdmin(proofId: string): Promise<SkillProofResponseDto> {
    const row = await this.repository.findOneForAdmin(proofId);
    if (!row) {
      throw new NotFoundException(SKILL_PROOF_MESSAGES.notFound);
    }
    return new SkillProofResponseDto(row);
  }

  /** The Advisor's own documents and their outcomes. An empty page, never a 404. */
  findManyForAdvisor(
    user: SessionUser,
    query: OffsetPaginationDto,
  ): Promise<PaginatedResult<OwnSkillProofResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.repository.findManyForAdvisor(user.id, options),
      () => this.repository.countForAdvisor(user.id),
      (row) => new OwnSkillProofResponseDto(row),
    );
  }

  approve(admin: SessionUser, proofId: string): Promise<SkillProofResponseDto> {
    return this.review(proofId, {
      reviewStatus: 'APPROVED',
      reviewedAt: new Date(),
      reviewedByAdminId: admin.id,
      // An approved document carrying the reason it was once rejected is a response no
      // screen can render sensibly, so the review clears it.
      rejectionReason: null,
    });
  }

  reject(
    admin: SessionUser,
    proofId: string,
    dto: RejectSkillProofDto,
  ): Promise<SkillProofResponseDto> {
    return this.review(proofId, {
      reviewStatus: 'REJECTED',
      rejectionReason: dto.reason,
      reviewedByAdminId: admin.id,
      reviewedAt: new Date(),
    });
  }

  /**
   * A review is a conditional update against the statuses that still accept one, so two
   * admins deciding at the same moment cannot both succeed. The loser is told apart
   * from a caller naming a document that does not exist by reading the row back.
   *
   * The reviewed document is then re-read through the admin select, so approve, reject
   * and the queue all answer in one shape.
   */
  private async review(
    proofId: string,
    review: SkillProofReview,
  ): Promise<SkillProofResponseDto> {
    const reviewed = await this.repository.review(
      proofId,
      DECIDABLE_SKILL_PROOF_STATUSES,
      review,
    );
    if (!reviewed) {
      throw await this.refusal(proofId);
    }
    return this.findOneForAdmin(proofId);
  }

  /**
   * `PENDING` is the only status a review is accepted from, so a document that exists
   * and refused one has already been reviewed — there is no third case to distinguish.
   */
  private async refusal(
    proofId: string,
  ): Promise<ConflictException | NotFoundException> {
    const current = await this.repository.findById(proofId);
    return current
      ? new ConflictException(SKILL_PROOF_MESSAGES.alreadyReviewed)
      : new NotFoundException(SKILL_PROOF_MESSAGES.notFound);
  }
}
