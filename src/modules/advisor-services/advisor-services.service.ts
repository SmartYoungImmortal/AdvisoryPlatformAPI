import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import {
  buildElasticsearchQuery,
  type ElasticsearchFilter,
} from '@/common/search/elasticsearch-query.builder';
import { ElasticsearchGateway } from '@/common/search/elasticsearch.service';
import {
  paginateQuery,
  paginate,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { services } from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import {
  ADVISOR_SERVICE_MESSAGES,
  PUBLIC_SERVICES_SEARCH_INDEX,
} from './advisor-services.constants';
import { AdvisorServicesRepository } from './advisor-services.repository';
import type { PublicServiceSearchDocument } from './advisor-services.types';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import { AdvisorServiceResponseDto } from './dtos/advisor-service-response.dto';
import { CreateAdvisorServiceDto } from './dtos/create-advisor-service.dto';
import { PublicServiceQueryDto } from './dtos/public-service-query.dto';
import { PublicServiceResponseDto } from './dtos/public-service-response.dto';
import { UpdateAdvisorServiceDto } from './dtos/update-advisor-service.dto';

type AdvisorService = InferSelectModel<typeof services>;

@Injectable()
export class AdvisorServicesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdvisorServicesService.name);

  constructor(
    private readonly repository: AdvisorServicesRepository,
    private readonly elasticsearch: ElasticsearchGateway,
  ) {}

  onApplicationBootstrap(): void {
    void this.rebuildPublicSearchIndex().catch((error: unknown) => {
      this.logger.warn(
        `Elasticsearch was unavailable during index startup: ${this.errorMessage(error)}`,
      );
    });
  }

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

    try {
      const result =
        await this.elasticsearch.search<PublicServiceSearchDocument>({
          index: PUBLIC_SERVICES_SEARCH_INDEX,
          from: query.offset,
          size: query.limit,
          query: buildElasticsearchQuery({
            ...(query.q
              ? { text: { value: query.q, fields: ['name^3', 'description'] } }
              : {}),
            filters: this.toPublicSearchFilters(query),
          }),
        });
      const ids = result.documents.map((document) => document.id);
      const currentServices = await this.repository.findPublishedByIds(ids);
      const byId = new Map(
        currentServices.map((service) => [service.id, service]),
      );
      const ordered = ids.flatMap((id) => {
        const service = byId.get(id);
        return service ? [new PublicServiceResponseDto(service)] : [];
      });
      return paginate(ordered, result.total, query);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        ADVISOR_SERVICE_MESSAGES.publicSearchUnavailable,
      );
    }
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

    await this.syncPublicSearchDocument(service.id);
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

    await this.syncPublicSearchDocument(updated.id);
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

    await this.syncPublicSearchDocument(service.id);
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

  private toPublicSearchFilters(
    query: PublicServiceQueryDto,
  ): ElasticsearchFilter[] {
    return [
      ...(query.categoryId
        ? [
            {
              kind: 'term' as const,
              field: 'categoryId',
              value: query.categoryId,
            },
          ]
        : []),
      ...(query.advisorId
        ? [
            {
              kind: 'term' as const,
              field: 'advisorId',
              value: query.advisorId,
            },
          ]
        : []),
      ...(query.minPriceSatang !== undefined ||
      query.maxPriceSatang !== undefined
        ? [
            {
              kind: 'range' as const,
              field: 'priceSatang',
              ...(query.minPriceSatang !== undefined
                ? { gte: query.minPriceSatang }
                : {}),
              ...(query.maxPriceSatang !== undefined
                ? { lte: query.maxPriceSatang }
                : {}),
            },
          ]
        : []),
    ];
  }

  private async syncPublicSearchDocument(serviceId: string): Promise<void> {
    try {
      await this.ensurePublicSearchIndex();
      const service = await this.repository.findPublishedById(serviceId);
      if (service) {
        await this.elasticsearch.indexDocument({
          index: PUBLIC_SERVICES_SEARCH_INDEX,
          id: service.id,
          document: service,
        });
        return;
      }
      await this.elasticsearch.deleteDocument({
        index: PUBLIC_SERVICES_SEARCH_INDEX,
        id: serviceId,
      });
    } catch (error) {
      this.logger.warn(
        `Could not synchronize public service search: ${this.errorMessage(error)}`,
      );
    }
  }

  private async ensurePublicSearchIndex(): Promise<void> {
    if (!(await this.elasticsearch.indexExists(PUBLIC_SERVICES_SEARCH_INDEX))) {
      await this.rebuildPublicSearchIndex();
    }
  }

  private async rebuildPublicSearchIndex(): Promise<void> {
    if (await this.elasticsearch.indexExists(PUBLIC_SERVICES_SEARCH_INDEX)) {
      await this.elasticsearch.deleteIndex(PUBLIC_SERVICES_SEARCH_INDEX);
    }
    await this.elasticsearch.createIndex({
      index: PUBLIC_SERVICES_SEARCH_INDEX,
      mappings: {
        properties: {
          id: { type: 'keyword' },
          advisorId: { type: 'keyword' },
          categoryId: { type: 'keyword' },
          name: { type: 'text' },
          description: { type: 'text' },
          priceSatang: { type: 'integer' },
          durationMinutes: { type: 'integer' },
          screeningRequired: { type: 'boolean' },
          trialEnabled: { type: 'boolean' },
          trialDurationMinutes: { type: 'integer' },
        },
      },
    });
    await this.elasticsearch.bulkIndex({
      index: PUBLIC_SERVICES_SEARCH_INDEX,
      documents: await this.repository.findAllPublished(),
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error';
  }
}
