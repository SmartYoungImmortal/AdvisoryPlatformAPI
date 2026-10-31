import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import type { SessionUser } from '@/modules/auth/auth.config';
import { RefundsRepository } from './refunds.repository';
import { RefundCaseEvidenceResponseDto } from './dtos/refund-case-evidence-response.dto';
import {
  MAX_REFUND_EVIDENCE_BYTES,
  MAX_REFUND_EVIDENCE_FILES,
  REFUND_EVIDENCE_EXTENSIONS,
  REFUND_EVIDENCE_MESSAGES as M,
  REFUND_EVIDENCE_URL_SECONDS,
} from './refund-evidence.constants';

@Injectable()
export class RefundEvidenceService {
  private readonly logger = new Logger(RefundEvidenceService.name);
  constructor(
    private readonly repository: RefundsRepository,
    private readonly storage: SeaweedFsStorageService,
  ) {}

  private async own(user: SessionUser, id: string) {
    const row = await this.repository.findById(id);
    if (!row || row.requestedByUserId !== user.id)
      throw new NotFoundException(M.notFound);
    return row;
  }

  async list(
    user: SessionUser,
    id: string,
  ): Promise<RefundCaseEvidenceResponseDto[]> {
    await this.own(user, id);
    return (await this.repository.findEvidence(id)).map(
      (row) => new RefundCaseEvidenceResponseDto(row),
    );
  }

  async upload(
    user: SessionUser,
    id: string,
    file: Express.Multer.File | undefined,
  ): Promise<RefundCaseEvidenceResponseDto> {
    const refund = await this.own(user, id);
    if (!file || file.size === 0) throw new BadRequestException(M.required);
    if (file.size > MAX_REFUND_EVIDENCE_BYTES)
      throw new PayloadTooLargeException(M.tooLarge);
    const extension = REFUND_EVIDENCE_EXTENSIONS[file.mimetype];
    if (!extension) throw new BadRequestException(M.invalidType);
    const digest = createHash('sha256').update(file.buffer).digest('hex');
    const objectKey = `refund-evidence/${id}/${digest}.${extension}`;
    const files = await this.repository.findEvidence(id);
    const existing = files.find((row) => row.objectKey === objectKey);
    if (existing) return new RefundCaseEvidenceResponseDto(existing);
    if (files.length >= MAX_REFUND_EVIDENCE_FILES)
      throw new BadRequestException(M.full);
    if (refund.status !== 'OPEN') throw new BadRequestException(M.resolved);
    try {
      await this.storage.putObject({
        key: objectKey,
        body: file.buffer,
        contentType: file.mimetype,
      });
    } catch {
      throw new ServiceUnavailableException(M.unavailable);
    }
    // Keep the object after an uncertain database outcome: a retry may have
    // committed the same content-addressed key. Definitive refusals can clean up.
    try {
      return new RefundCaseEvidenceResponseDto(
        await this.repository.appendEvidence(user.id, id, {
          objectKey,
          originalFileName: file.originalname,
          mimeType: file.mimetype,
        }),
      );
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        try {
          await this.storage.removeObject(objectKey);
        } catch {
          this.logger.warn(
            `Could not remove unattached evidence: ${objectKey}`,
          );
        }
      } else {
        this.logger.warn(
          `Uncertain evidence write requires reconciliation: ${objectKey}`,
        );
      }
      throw error;
    }
  }

  async ownUrl(user: SessionUser, id: string, objectKey: string) {
    await this.own(user, id);
    return this.adminUrl(id, objectKey);
  }

  async adminUrl(id: string, objectKey: string) {
    const evidence = (await this.repository.findEvidence(id)).find(
      (row) => row.objectKey === objectKey,
    );
    if (!evidence) throw new NotFoundException(M.notFound);
    try {
      return {
        url: await this.storage.createDownloadUrl(
          objectKey,
          REFUND_EVIDENCE_URL_SECONDS,
        ),
        expiresInSeconds: REFUND_EVIDENCE_URL_SECONDS,
      };
    } catch {
      throw new ServiceUnavailableException(M.unavailable);
    }
  }
}
