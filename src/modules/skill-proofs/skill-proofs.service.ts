import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  paginateQuery,
  type OffsetPaginationDto,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import { OwnSkillProofResponseDto } from './dtos/own-skill-proof-response.dto';
import { RejectSkillProofDto } from './dtos/reject-skill-proof.dto';
import { SkillProofQueryDto } from './dtos/skill-proof-query.dto';
import { SkillProofResponseDto } from './dtos/skill-proof-response.dto';
import { SubmitSkillProofDto } from './dtos/submit-skill-proof.dto';
import {
  DECIDABLE_SKILL_PROOF_STATUSES,
  MAX_SKILL_PROOF_BYTES,
  SKILL_PROOF_EXTENSIONS,
  SKILL_PROOF_MESSAGES,
  decodeUploadedFileName,
  skillProofObjectKey,
} from './skill-proofs.constants';
import {
  SkillProofsRepository,
  type SkillProofReview,
} from './skill-proofs.repository';

/** The part of a multer file a submission reads. */
export interface SkillProofUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

@Injectable()
export class SkillProofsService {
  private readonly logger = new Logger(SkillProofsService.name);

  constructor(
    private readonly repository: SkillProofsRepository,
    private readonly storage: SeaweedFsStorageService,
  ) {}

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

  /**
   * The applicant files a document proving one of their skills, which also claims
   * that skill. Stored first and recorded second, so a record never names an object
   * that never landed; if the record write fails, the object is removed again.
   */
  async submit(
    user: SessionUser,
    dto: SubmitSkillProofDto,
    upload: SkillProofUpload | undefined,
  ): Promise<OwnSkillProofResponseDto> {
    this.validateUpload(upload);
    const [applied, skillExists] = await Promise.all([
      this.repository.applicationExists(user.id),
      this.repository.skillExists(dto.skillId),
    ]);
    if (!applied) {
      throw new NotFoundException(SKILL_PROOF_MESSAGES.applicationRequired);
    }
    if (!skillExists) {
      throw new BadRequestException(SKILL_PROOF_MESSAGES.skillNotFound);
    }

    const objectKey = skillProofObjectKey(
      user.id,
      SKILL_PROOF_EXTENSIONS[upload.mimetype],
    );
    try {
      await this.storage.putObject({
        key: objectKey,
        body: upload.buffer,
        contentType: upload.mimetype,
      });
    } catch {
      throw new ServiceUnavailableException(
        SKILL_PROOF_MESSAGES.storageUnavailable,
      );
    }

    try {
      const row = await this.repository.createForAdvisor({
        advisorId: user.id,
        skillId: dto.skillId,
        objectKey,
        originalFileName: decodeUploadedFileName(upload.originalname),
      });
      return new OwnSkillProofResponseDto(row);
    } catch (error: unknown) {
      await this.removeOrphan(objectKey);
      throw error;
    }
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

  private validateUpload(
    upload: SkillProofUpload | undefined,
  ): asserts upload is SkillProofUpload {
    if (!upload || upload.size === 0) {
      throw new BadRequestException(SKILL_PROOF_MESSAGES.fileRequired);
    }
    if (!SKILL_PROOF_EXTENSIONS[upload.mimetype]) {
      throw new BadRequestException(SKILL_PROOF_MESSAGES.fileInvalidType);
    }
    if (upload.size > MAX_SKILL_PROOF_BYTES) {
      throw new BadRequestException(SKILL_PROOF_MESSAGES.fileTooLarge);
    }
  }

  private async removeOrphan(key: string): Promise<void> {
    try {
      await this.storage.removeObject(key);
    } catch (error: unknown) {
      this.logger.warn(
        `Could not remove orphaned object ${key}; it must be cleaned up separately.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
