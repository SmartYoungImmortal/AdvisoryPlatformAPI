import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginatedResult,
  paginate,
} from '../../common/pagination/offset-pagination.dto';
import { CreateServiceCategoryDto } from './dtos/create-service-category.dto';
import { ServiceCategoryQueryDto } from './dtos/service-category-query.dto';
import { ServiceCategoryResponseDto } from './dtos/service-category-response.dto';
import { UpdateServiceCategoryDto } from './dtos/update-service-category.dto';
import { ServiceCategoriesRepository } from './service-categories.repository';

@Injectable()
export class ServiceCategoriesService {
  constructor(
    private readonly serviceCategoriesRepository: ServiceCategoriesRepository,
  ) {}

  async findMany(
    query: ServiceCategoryQueryDto,
  ): Promise<PaginatedResult<ServiceCategoryResponseDto>> {
    const [items, total] = await Promise.all([
      this.serviceCategoriesRepository.findMany(undefined, {
        limit: query.limit,
        offset: query.offset,
      }),
      this.serviceCategoriesRepository.count(),
    ]);

    return paginate(
      items.map((category) => new ServiceCategoryResponseDto(category)),
      total,
      query,
    );
  }

  async findOne(id: string): Promise<ServiceCategoryResponseDto> {
    const category = await this.serviceCategoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException('Service category not found');
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
      throw new NotFoundException('Service category not found');
    }

    return new ServiceCategoryResponseDto(category);
  }

  async delete(id: string): Promise<void> {
    const category = await this.serviceCategoriesRepository.deleteById(id);

    if (!category) {
      throw new NotFoundException('Service category not found');
    }
  }
}
