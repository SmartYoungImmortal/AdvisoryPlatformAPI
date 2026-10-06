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
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import { IdentitySubmissionResponseDto } from './dtos/identity-submission-response.dto';
import { IdentityVerificationQueryDto } from './dtos/identity-verification-query.dto';
import { IdentityVerificationResponseDto } from './dtos/identity-verification-response.dto';
import { OwnIdentityVerificationResponseDto } from './dtos/own-identity-verification-response.dto';
import { RejectIdentityVerificationDto } from './dtos/reject-identity-verification.dto';
import {
  DECIDABLE_IDENTITY_STATUSES,
  IDENTITY_DOCUMENT_EXTENSIONS,
  IDENTITY_VERIFICATION_MESSAGES,
  MAX_IDENTITY_DOCUMENT_BYTES,
  SUBMITTABLE_IDENTITY_STATUSES,
  identityDocumentObjectKey,
  isTerminalIdentityStatus,
} from './identity-verification.constants';
import { IdentityVerificationRepository } from './identity-verification.repository';

/** The part of a multer file the submission reads. */
export interface IdentityDocumentUpload {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);

  constructor(
    private readonly repository: IdentityVerificationRepository,
    private readonly storage: SeaweedFsStorageService,
  ) {}

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

  /**
   * The applicant uploads their ID-card scan for an admin to review.
   *
   * The object is stored first and the record pointed at it second, because a record
   * naming a key that never landed is worse than an object nobody names. If the record
   * refuses the submission — or the write fails — the object just stored is removed
   * again; on success the document it replaces is removed instead.
   */
  async submit(
    user: SessionUser,
    upload: IdentityDocumentUpload | undefined,
  ): Promise<IdentitySubmissionResponseDto> {
    this.validateUpload(upload);
    if (!(await this.repository.applicationExists(user.id))) {
      throw new NotFoundException(
        IDENTITY_VERIFICATION_MESSAGES.applicationRequired,
      );
    }

    const objectKey = identityDocumentObjectKey(
      user.id,
      IDENTITY_DOCUMENT_EXTENSIONS[upload.mimetype],
    );
    try {
      await this.storage.putObject({
        key: objectKey,
        body: upload.buffer,
        contentType: upload.mimetype,
      });
    } catch {
      throw new ServiceUnavailableException(
        IDENTITY_VERIFICATION_MESSAGES.storageUnavailable,
      );
    }

    let submitted: Awaited<
      ReturnType<IdentityVerificationRepository['submit']>
    >;
    try {
      submitted = await this.repository.submit(
        user.id,
        objectKey,
        SUBMITTABLE_IDENTITY_STATUSES,
      );
    } catch (error: unknown) {
      await this.removeOrphan(objectKey);
      throw error;
    }

    if (!submitted) {
      await this.removeOrphan(objectKey);
      const current = await this.repository.findOwn(user.id);
      throw new ConflictException(
        current?.verificationStatus === 'VERIFIED'
          ? IDENTITY_VERIFICATION_MESSAGES.alreadyVerified
          : IDENTITY_VERIFICATION_MESSAGES.awaitingReview,
      );
    }

    if (submitted.previousDocumentObjectKey) {
      await this.removeOrphan(submitted.previousDocumentObjectKey);
    }
    return new IdentitySubmissionResponseDto({
      verificationStatus: 'SUBMITTED',
      submittedAt: submitted.submittedAt,
    });
  }

  /**
   * Approval is what makes an applicant an Advisor: the repository writes the
   * verified status and `user.role = 'advisor'` in one transaction.
   */
  approve(
    admin: SessionUser,
    advisorId: string,
  ): Promise<IdentityVerificationResponseDto> {
    return this.decide(advisorId, (accepted) =>
      this.repository.approve(advisorId, accepted, {
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedByAdminId: admin.id,
        // A verified record carrying the reason it was once rejected is a response no
        // screen can render sensibly, so the ruling clears it.
        rejectionReason: null,
      }),
    );
  }

  /**
   * A rejection leaves the applicant an Advisee. They may submit a new document,
   * which puts the record back to `SUBMITTED` for a fresh review.
   */
  reject(
    admin: SessionUser,
    advisorId: string,
    dto: RejectIdentityVerificationDto,
  ): Promise<IdentityVerificationResponseDto> {
    return this.decide(advisorId, (accepted) =>
      this.repository.decide(advisorId, accepted, {
        verificationStatus: 'REJECTED',
        rejectionReason: dto.reason,
        verifiedByAdminId: admin.id,
        // Nothing was verified, so there is no verification time. `advisor_identity`
        // has no separate `decidedAt`, so a rejection's timestamp is not recorded
        // anywhere — the reviewer and the reason are.
        verifiedAt: null,
      }),
    );
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
    write: (
      acceptedStatuses: typeof DECIDABLE_IDENTITY_STATUSES,
    ) => Promise<boolean>,
  ): Promise<IdentityVerificationResponseDto> {
    const decided = await write(DECIDABLE_IDENTITY_STATUSES);
    if (!decided) {
      throw await this.refusal(advisorId);
    }
    return this.findOneForAdmin(advisorId);
  }

  private validateUpload(
    upload: IdentityDocumentUpload | undefined,
  ): asserts upload is IdentityDocumentUpload {
    if (!upload || upload.size === 0) {
      throw new BadRequestException(
        IDENTITY_VERIFICATION_MESSAGES.documentRequired,
      );
    }
    if (!IDENTITY_DOCUMENT_EXTENSIONS[upload.mimetype]) {
      throw new BadRequestException(
        IDENTITY_VERIFICATION_MESSAGES.documentInvalidType,
      );
    }
    if (upload.size > MAX_IDENTITY_DOCUMENT_BYTES) {
      throw new BadRequestException(
        IDENTITY_VERIFICATION_MESSAGES.documentTooLarge,
      );
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
