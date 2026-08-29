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
      (options) =>
        this.serviceCategoriesRepository.findMany(undefined, options),
      () => this.serviceCategoriesRepository.count(),
      (category) => new ServiceCategoryResponseDto(category),
    );
  }

  async findOne(id: string): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException(SERVICE_CATEGORY_MESSAGES.notFound);
    }

    return new ServiceCategoryResponseDto(category);
  }

  async create(
    dto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.create(dto);
    return new ServiceCategoryResponseDto(category);
  }

  async update(
    id: string,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.updateById(id, dto);

    if (!category) {
      throw new NotFoundException(SERVICE_CATEGORY_MESSAGES.notFound);
    }

    return new ServiceCategoryResponseDto(category);
  }

  async delete(id: string): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.deleteById(id);

    if (!category) {
      throw new NotFoundException(SERVICE_CATEGORY_MESSAGES.notFound);
    }

    return new ServiceCategoryResponseDto(category);
  }
}
