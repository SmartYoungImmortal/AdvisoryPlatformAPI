import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import { CreateServiceCategoryDto } from './dtos/create-service-category.dto';
import { ServiceCategoryQueryDto } from './dtos/service-category-query.dto';
import { ServiceCategoryResponseDto } from './dtos/service-category-response.dto';
import { UpdateServiceCategoryDto } from './dtos/update-service-category.dto';
import { SERVICE_CATEGORY_MESSAGES } from './service-categories.constants';
import { ServiceCategoriesRepository } from './service-categories.repository';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    private readonly serviceCategoriesRepository: ServiceCategoriesRepository,
  ) {}

  async findMany(
    query: ServiceCategoryQueryDto,
  ): Promise<PaginatedResult<ServiceCategoryResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.serviceCategoriesRepository.findManyLocalized(options),
      () => this.serviceCategoriesRepository.count(),
      (category) => new ServiceCategoryResponseDto(category),
    );
  }

  async findOne(id: string): Promise<ServiceCategoryResponseDto> {
    const category =
      await this.serviceCategoriesRepository.findByIdLocalized(id);

    if (!category) {
      throw new NotFoundException(SERVICE_CATEGORY_MESSAGES.notFound);
    }

    return new ServiceCategoryResponseDto(category);
  }

  /** `actorId` is the signed-in admin, from the session — never from the body. */
  async create(
    dto: CreateServiceCategoryDto,
    actorId: string,
  ): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.createLocalized({
      ...dto,
      createdByUserId: actorId,
      updatedByUserId: actorId,
    });
    return new ServiceCategoryResponseDto(category);
  }

  /** In English, the name and description change for English readers only; see `updateLocalized`. */
  async update(
    id: string,
    dto: UpdateServiceCategoryDto,
    actorId: string,
  ): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.updateLocalized(
      id,
      { ...dto, updatedByUserId: actorId },
    );

    if (!category) {
      throw new NotFoundException(SERVICE_CATEGORY_MESSAGES.notFound);
    }

    return new ServiceCategoryResponseDto(category);
  }

  async delete(id: string): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.deleteLocalized(id);

    if (!category) {
      throw new NotFoundException(SERVICE_CATEGORY_MESSAGES.notFound);
    }

    return new ServiceCategoryResponseDto(category);
  }
}
