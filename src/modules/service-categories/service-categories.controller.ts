import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiDelete,
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '../../common/decorators/api-docs.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResult } from '../../common/pagination/offset-pagination.dto';
import { CreateServiceCategoryDto } from './dtos/create-service-category.dto';
import { ServiceCategoryQueryDto } from './dtos/service-category-query.dto';
import { ServiceCategoryResponseDto } from './dtos/service-category-response.dto';
import { UpdateServiceCategoryDto } from './dtos/update-service-category.dto';
import { SERVICE_CATEGORY_MESSAGES } from './service-categories.constants';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('Service Categories')
@Controller('api/v1/service-categories')
export class ServiceCategoriesController {
  constructor(
    private readonly serviceCategoriesService: ServiceCategoriesService,
  ) {}

  @Public()
  @Get()
  @ApiGetPaginated(ServiceCategoryResponseDto, { public: true })
  findMany(
    @Query() query: ServiceCategoryQueryDto,
  ): Promise<PaginatedResult<ServiceCategoryResponseDto>> {
    return this.serviceCategoriesService.findMany(query);
  }

  @Public()
  @Get(':id')
  @ApiGetOne(ServiceCategoryResponseDto, { public: true })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceCategoryResponseDto> {
    return this.serviceCategoriesService.findOne(id);
  }

  @Roles(Role.Admin)
  @Post()
  @ResponseMessage(SERVICE_CATEGORY_MESSAGES.created)
  @ApiCreate(ServiceCategoryResponseDto)
  create(
    @Body() dto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.serviceCategoriesService.create(dto);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  @ResponseMessage(SERVICE_CATEGORY_MESSAGES.updated)
  @ApiUpdate(ServiceCategoryResponseDto)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.serviceCategoriesService.update(id, dto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(SERVICE_CATEGORY_MESSAGES.deleted)
  @ApiDelete(ServiceCategoryResponseDto)
  delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceCategoryResponseDto> {
    return this.serviceCategoriesService.delete(id);
  }
}
