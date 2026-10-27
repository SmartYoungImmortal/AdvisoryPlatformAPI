import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import {
  paginate,
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { SeaweedFsStorageService } from '@/common/storage/seaweedfs-storage.service';
import { services } from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AvailabilityService } from '@/modules/availability/availability.service';
import {
  ADVISOR_SERVICE_MESSAGES,
  SERVICE_IMAGE_URL_EXPIRY_SECONDS,
} from './advisor-services.constants';
import { AdvisorServicesRepository } from './advisor-services.repository';
import type { PublicServiceDocument } from './advisor-services.types';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import { AdvisorServiceResponseDto } from './dtos/advisor-service-response.dto';
import { CreateAdvisorServiceDto } from './dtos/create-advisor-service.dto';
import { PublicServiceQueryDto } from './dtos/public-service-query.dto';
import { PublicServiceResponseDto } from './dtos/public-service-response.dto';
import { UpdateAdvisorServiceDto } from './dtos/update-advisor-service.dto';

type AdvisorService = InferSelectModel<typeof services>;

/** How many matching services an `availableOn` search checks before paging. */
const AVAILABLE_ON_SCAN_LIMIT = 500;

/**
 * A photograph key that is already a fetchable URL rather than a storage key —
 * the demo catalogue's photographs are public R2 URLs. Returned unchanged.
 */
function isAbsoluteUrl(key: string): boolean {
  return /^https?:\/\//i.test(key);
}

@Injectable()
export class AdvisorServicesService {
  private readonly logger = new Logger(AdvisorServicesService.name);

  constructor(
    private readonly repository: AdvisorServicesRepository,
    private readonly availability: AvailabilityService,
    private readonly storage: SeaweedFsStorageService,
  ) {}

  async findMany(
    user: SessionUser,
    query: AdvisorServiceQueryDto,
  ): Promise<PaginatedResult<AdvisorServiceResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.repository.findManyByAdvisorId(user.id, options),
      () => this.repository.countByAdvisorId(user.id),
      (service) => new AdvisorServiceResponseDto(service),
    );
  }

  async findOne(
    user: SessionUser,
    serviceId: string,
  ): Promise<AdvisorServiceResponseDto> {
    return new AdvisorServiceResponseDto(
      await this.getOwned(user.id, serviceId),
    );
  }

  async findManyForAdmin(
    query: AdvisorServiceQueryDto,
  ): Promise<PaginatedResult<AdvisorServiceResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.repository.findManyLocalized(options),
      () => this.repository.count(),
      (service) => new AdvisorServiceResponseDto(service),
    );
  }

  async findPublished(
    query: PublicServiceQueryDto,
  ): Promise<PaginatedResult<PublicServiceResponseDto>> {
    if (
      query.minPriceSatang !== undefined &&
      query.maxPriceSatang !== undefined &&
      query.minPriceSatang > query.maxPriceSatang
    ) {
      throw new BadRequestException(
        ADVISOR_SERVICE_MESSAGES.publicSearchInvalidPriceRange,
      );
    }

    if (query.availableOn)
      return this.findPublishedAvailableOn(query, query.availableOn);

    // `paginate` by hand rather than `paginateQuery`: the photographs for a page
    // are one query keyed on the ids that page returned, which a per-row `map`
    // cannot do without going back to the database once per row.
    const [rows, total] = await Promise.all([
      this.repository.findPublished(query, {
        limit: query.limit,
        offset: query.offset,
      }),
      this.repository.countPublished(query),
    ]);
    return paginate(await this.toListItems(rows), total, query);
  }

  /**
   * Availability is derived from each advisor's schedule, not stored, so it
   * cannot be a `where` clause: every service matching the other filters is
   * checked, and the page is cut from the ones that pass, so the total and the
   * last page stay true.
   */
  private async findPublishedAvailableOn(
    query: PublicServiceQueryDto,
    date: string,
  ): Promise<PaginatedResult<PublicServiceResponseDto>> {
    const candidates = await this.repository.findPublished(query, {
      limit: AVAILABLE_ON_SCAN_LIMIT,
      offset: 0,
    });
    // Every candidate checked in one batch, not a read per service.
    const open = await this.availability.openOn(
      candidates.map((service) => service.id),
      date,
    );
    const matching = candidates.filter((service) => open.has(service.id));
    const page = matching.slice(query.offset, query.offset + query.limit);
    return paginate(await this.toListItems(page), matching.length, query);
  }

  async findPublishedById(
    serviceId: string,
  ): Promise<PublicServiceResponseDto> {
    const service = await this.repository.findPublishedById(serviceId);
    if (!service) {
      throw new NotFoundException(ADVISOR_SERVICE_MESSAGES.notFound);
    }
    const keys = await this.repository.findImageKeysFor([service.id]);
    return new PublicServiceResponseDto(
      service,
      await this.resolveImageUrls(keys.map((row) => row.objectKey)),
    );
  }

  /**
   * A page of services as the public DTO, each with its photographs.
   *
   * The keys for the whole page are read in one query. Only keys that are already
   * URLs are kept: presigning goes through storage, and a page of results should
   * neither wait on it nor fail with it — the detail route presigns.
   */
  private async toListItems(
    rows: readonly PublicServiceDocument[],
  ): Promise<PublicServiceResponseDto[]> {
    const keys = await this.repository.findImageKeysFor(
      rows.map((row) => row.id),
    );
    const urlsByService = new Map<string, string[]>();
    for (const { serviceId, objectKey } of keys) {
      if (!isAbsoluteUrl(objectKey)) continue;
      const urls = urlsByService.get(serviceId);
      if (urls) urls.push(objectKey);
      else urlsByService.set(serviceId, [objectKey]);
    }
    return rows.map(
      (row) =>
        new PublicServiceResponseDto(row, urlsByService.get(row.id) ?? []),
    );
  }

  /**
   * One service's photograph keys as URLs a browser can fetch, in the same order:
   * an absolute URL as it is, a storage key presigned. A photograph that cannot be
   * signed is left out rather than failing the response it sits in.
   */
  private async resolveImageUrls(keys: readonly string[]): Promise<string[]> {
    const urls = await Promise.all(
      keys.map((key) => this.resolveImageUrl(key)),
    );
    return urls.filter((url): url is string => url !== null);
  }

  private async resolveImageUrl(key: string): Promise<string | null> {
    if (isAbsoluteUrl(key)) return key;
    try {
      return await this.storage.createDownloadUrl(
        key,
        SERVICE_IMAGE_URL_EXPIRY_SECONDS,
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Could not presign service image ${key}; it is left out of the response.`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  async create(
    user: SessionUser,
    dto: CreateAdvisorServiceDto,
  ): Promise<AdvisorServiceResponseDto> {
    await this.assertReferences(
      user.id,
      dto.categoryId,
      dto.availabilityProfileId,
    );
    this.assertTrialConfiguration(
      dto.trialEnabled ?? false,
      dto.trialDurationMinutes,
    );

    const service = await this.repository.createLocalized({
      advisorId: user.id,
      categoryId: dto.categoryId,
      availabilityProfileId: dto.availabilityProfileId,
      name: dto.name,
      description: dto.description,
      priceSatang: dto.priceSatang,
      durationMinutes: dto.durationMinutes,
      dailyConsultationLimitMinutes: dto.dailyConsultationLimitMinutes ?? null,
      isPublished: dto.isPublished ?? false,
      screeningRequired: dto.screeningRequired ?? false,
      trialEnabled: dto.trialEnabled ?? false,
      trialDurationMinutes: dto.trialEnabled ? dto.trialDurationMinutes : null,
    });

    return new AdvisorServiceResponseDto(service);
  }

  async update(
    user: SessionUser,
    serviceId: string,
    dto: UpdateAdvisorServiceDto,
  ): Promise<AdvisorServiceResponseDto> {
    const current = await this.getOwned(user.id, serviceId);
    const categoryId = dto.categoryId ?? current.categoryId;
    const availabilityProfileId =
      dto.availabilityProfileId ?? current.availabilityProfileId;

    if (!availabilityProfileId) {
      throw new BadRequestException(
        ADVISOR_SERVICE_MESSAGES.availabilityProfileNotFound,
      );
    }

    await this.assertReferences(user.id, categoryId, availabilityProfileId);

    const trialEnabled = dto.trialEnabled ?? current.trialEnabled;
    const trialDurationMinutes = trialEnabled
      ? (dto.trialDurationMinutes ?? current.trialDurationMinutes)
      : null;
    this.assertTrialConfiguration(trialEnabled, trialDurationMinutes);

    const updated = await this.repository.updateOwned(user.id, serviceId, {
      ...dto,
      trialEnabled,
      trialDurationMinutes,
    });

    if (!updated) {
      throw new NotFoundException(ADVISOR_SERVICE_MESSAGES.notFound);
    }

    return new AdvisorServiceResponseDto(updated);
  }

  async delete(
    user: SessionUser,
    serviceId: string,
  ): Promise<AdvisorServiceResponseDto> {
    const service = await this.repository.deleteOwned(user.id, serviceId);

    if (!service) {
      throw new NotFoundException(ADVISOR_SERVICE_MESSAGES.notFound);
    }

    return new AdvisorServiceResponseDto(service);
  }

  private async getOwned(
    advisorId: string,
    serviceId: string,
  ): Promise<AdvisorService> {
    const service = await this.repository.findOwnedById(advisorId, serviceId);

    if (!service) {
      throw new NotFoundException(ADVISOR_SERVICE_MESSAGES.notFound);
    }

    return service;
  }

  private async assertReferences(
    advisorId: string,
    categoryId: string,
    availabilityProfileId: string,
  ): Promise<void> {
    const [categoryExists, profileOwned] = await Promise.all([
      this.repository.categoryExists(categoryId),
      this.repository.availabilityProfileOwned(
        advisorId,
        availabilityProfileId,
      ),
    ]);

    if (!categoryExists) {
      throw new BadRequestException(ADVISOR_SERVICE_MESSAGES.categoryNotFound);
    }
    if (!profileOwned) {
      throw new BadRequestException(
        ADVISOR_SERVICE_MESSAGES.availabilityProfileNotFound,
      );
    }
  }

  private assertTrialConfiguration(
    trialEnabled: boolean,
    trialDurationMinutes: number | null | undefined,
  ): void {
    if (trialEnabled && !trialDurationMinutes) {
      throw new BadRequestException(
        ADVISOR_SERVICE_MESSAGES.trialDurationRequired,
      );
    }
    if (
      !trialEnabled &&
      trialDurationMinutes !== null &&
      trialDurationMinutes !== undefined
    ) {
      throw new BadRequestException(
        ADVISOR_SERVICE_MESSAGES.trialDurationForbidden,
      );
    }
  }
}
