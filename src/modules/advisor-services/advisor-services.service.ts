import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import {
  paginate,
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { services } from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import { AvailabilityService } from '@/modules/availability/availability.service';
import { ADVISOR_SERVICE_MESSAGES } from './advisor-services.constants';
import { AdvisorServicesRepository } from './advisor-services.repository';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import { AdvisorServiceResponseDto } from './dtos/advisor-service-response.dto';
import { CreateAdvisorServiceDto } from './dtos/create-advisor-service.dto';
import { PublicServiceQueryDto } from './dtos/public-service-query.dto';
import { PublicServiceResponseDto } from './dtos/public-service-response.dto';
import { UpdateAdvisorServiceDto } from './dtos/update-advisor-service.dto';

type AdvisorService = InferSelectModel<typeof services>;

/** How many matching services an `availableOn` search checks before paging. */
const AVAILABLE_ON_SCAN_LIMIT = 500;

@Injectable()
export class AdvisorServicesService {
  constructor(
    private readonly repository: AdvisorServicesRepository,
    private readonly availability: AvailabilityService,
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
      (options) => this.repository.findMany(undefined, options),
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

    return paginateQuery(
      query,
      (options) => this.repository.findPublished(query, options),
      () => this.repository.countPublished(query),
      (service) => new PublicServiceResponseDto(service),
    );
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
    const open = await Promise.all(
      candidates.map((service) =>
        this.availability.hasOpenSlotOn(service.id, date),
      ),
    );
    const matching = candidates.filter((_, i) => open[i]);
    const page = matching.slice(query.offset, query.offset + query.limit);
    return paginate(
      page.map((service) => new PublicServiceResponseDto(service)),
      matching.length,
      query,
    );
  }

  async findPublishedById(
    serviceId: string,
  ): Promise<PublicServiceResponseDto> {
    const service = await this.repository.findPublishedById(serviceId);
    if (!service) {
      throw new NotFoundException(ADVISOR_SERVICE_MESSAGES.notFound);
    }
    return new PublicServiceResponseDto(service);
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

    const service = await this.repository.create({
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
