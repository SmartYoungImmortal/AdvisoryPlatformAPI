import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import { imageExtension, isAbsoluteUrl } from '@/common/storage/stored-image';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorsRepository } from './advisors.repository';
import {
  AdvisorPortfolioRepository,
  type PortfolioItemRow,
  type PortfolioItemValues,
} from './advisor-portfolio.repository';
import type {
  CreatePortfolioItemDto,
  PortfolioItemResponseDto,
  ReorderPortfolioDto,
  UpdatePortfolioItemDto,
} from './dtos/advisor-portfolio.dto';

/** The largest picture a piece of work may carry; the same as a service photograph. */
export const MAX_PORTFOLIO_IMAGE_BYTES = 5 * 1024 * 1024;
const PORTFOLIO_IMAGE_URL_EXPIRY_SECONDS = 60 * 60;

/**
 * An Advisor's portfolio: read by anyone on a discoverable Advisor's profile, and kept by the
 * Advisor from their profile editor, one piece at a time.
 */
@Injectable()
export class AdvisorPortfolioService {
  private readonly logger = new Logger(AdvisorPortfolioService.name);

  constructor(
    private readonly portfolio: AdvisorPortfolioRepository,
    private readonly advisors: AdvisorsRepository,
    private readonly storage: SeaweedFsStorageService,
  ) {}

  /** A discoverable Advisor's pieces; anyone else's is a 404, as their profile is. */
  async findPublic(advisorId: string): Promise<PortfolioItemResponseDto[]> {
    if (!(await this.advisors.findDiscoverableById(advisorId))) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
    return this.toResponses(await this.portfolio.list(advisorId));
  }

  async findMine(user: SessionUser): Promise<PortfolioItemResponseDto[]> {
    await this.ownProfile(user);
    return this.toResponses(await this.portfolio.list(user.id));
  }

  async create(
    user: SessionUser,
    dto: CreatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    await this.ownProfile(user);
    const row = await this.portfolio.create(user.id, {
      title: dto.title,
      description: blankToNull(dto.description),
      link: blankToNull(dto.link),
    });
    return this.toResponse(row);
  }

  async update(
    user: SessionUser,
    itemId: string,
    dto: UpdatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    const changes: Partial<PortfolioItemValues> = {};
    if (dto.title !== undefined) changes.title = dto.title;
    if (dto.description !== undefined)
      changes.description = blankToNull(dto.description);
    if (dto.link !== undefined) changes.link = blankToNull(dto.link);
    const row =
      Object.keys(changes).length === 0
        ? await this.portfolio.findOwned(user.id, itemId)
        : await this.portfolio.update(user.id, itemId, changes);
    return this.toResponse(row);
  }

  /** Takes the piece away, and its stored pictures with it; answers the pieces left. */
  async remove(
    user: SessionUser,
    itemId: string,
  ): Promise<PortfolioItemResponseDto[]> {
    const row = await this.portfolio.remove(user.id, itemId);
    await Promise.all(row.imageKeys.map((key) => this.removeStored(key)));
    return this.toResponses(await this.portfolio.list(user.id));
  }

  async reorder(
    user: SessionUser,
    dto: ReorderPortfolioDto,
  ): Promise<PortfolioItemResponseDto[]> {
    await this.portfolio.reorder(user.id, dto.ids);
    return this.toResponses(await this.portfolio.list(user.id));
  }

  async uploadImage(
    user: SessionUser,
    itemId: string,
    file: Express.Multer.File | undefined,
  ): Promise<PortfolioItemResponseDto> {
    await this.portfolio.findOwned(user.id, itemId);
    if (!file || file.size === 0)
      throw new BadRequestException('Choose a picture of the work');
    if (file.size > MAX_PORTFOLIO_IMAGE_BYTES)
      throw new PayloadTooLargeException('Pictures must be 5 MiB or smaller');
    const extension = imageExtension(file);
    if (!extension)
      throw new BadRequestException('Choose a JPEG, PNG or WebP image');
    const key = `portfolio/${user.id}/${itemId}/${crypto.randomUUID()}.${extension}`;
    try {
      await this.storage.putObject({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });
    } catch {
      throw new ServiceUnavailableException('Picture storage is unavailable');
    }
    let row: PortfolioItemRow;
    try {
      row = await this.portfolio.appendImage(user.id, itemId, key);
    } catch (error: unknown) {
      await this.removeStored(key);
      throw error;
    }
    return this.toResponse(row);
  }

  async removeImage(
    user: SessionUser,
    itemId: string,
    index: number,
  ): Promise<PortfolioItemResponseDto> {
    const { row, key } = await this.portfolio.removeImage(
      user.id,
      itemId,
      index,
    );
    await this.removeStored(key);
    return this.toResponse(row);
  }

  private async ownProfile(user: SessionUser): Promise<void> {
    if (!(await this.advisors.findByUserId(user.id))) {
      throw new NotFoundException(ADVISOR_MESSAGES.notFound);
    }
  }

  private toResponses(
    rows: readonly PortfolioItemRow[],
  ): Promise<PortfolioItemResponseDto[]> {
    return Promise.all(rows.map((row) => this.toResponse(row)));
  }

  private async toResponse(
    row: PortfolioItemRow,
  ): Promise<PortfolioItemResponseDto> {
    const images = await Promise.all(
      row.imageKeys.map((key) => this.imageUrl(key)),
    );
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      link: row.link,
      images: images.filter((url): url is string => url !== null),
      createdAt: row.createdAt,
    };
  }

  /** A picture as a URL a browser can fetch; one that cannot be signed is left out. */
  private async imageUrl(key: string): Promise<string | null> {
    if (isAbsoluteUrl(key)) return key;
    try {
      return await this.storage.createDownloadUrl(
        key,
        PORTFOLIO_IMAGE_URL_EXPIRY_SECONDS,
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Could not presign portfolio image ${key}; it is left out of the response.`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  /** Removes a stored picture where it is one of ours; a failure only leaves an orphan. */
  private async removeStored(key: string): Promise<void> {
    if (isAbsoluteUrl(key)) return;
    try {
      await this.storage.removeObject(key);
    } catch {
      this.logger.warn(`Could not remove portfolio image ${key}`);
    }
  }
}

/** An optional line left blank is no line at all. */
function blankToNull(value: string | null | undefined): string | null {
  return value || null;
}
