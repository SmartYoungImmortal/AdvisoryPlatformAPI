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
import { ServiceCategoriesService } from './service-categories.service';

// The one place this controller's entity name is spelled out — see skills.controller.ts.
const ENTITY_NAME = 'Service category';

/** Pure CRUD, per CLAUDE.md's "no BaseCrudService" note — the other of the two modules that actually is one. */
@ApiTags('Service Categories')
@Controller('api/v1/service-categories')
export class ServiceCategoriesController {
  constructor(
    private readonly serviceCategoriesService: ServiceCategoriesService,
  ) {}

  @Public()
  @Get()
  @ApiGetPaginated(ServiceCategoryResponseDto, ENTITY_NAME, { public: true })
  findMany(
    @Query() query: ServiceCategoryQueryDto,
  ): Promise<PaginatedResult<ServiceCategoryResponseDto>> {
    return this.serviceCategoriesService.findMany(query);
  }

  @Public()
  @Get(':id')
  @ApiGetOne(ServiceCategoryResponseDto, ENTITY_NAME, { public: true })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceCategoryResponseDto> {
    return this.serviceCategoriesService.findOne(id);
  }

  @Roles(Role.Admin)
  @Post()
  @ResponseMessage('Service category created')
  @ApiCreate(ServiceCategoryResponseDto, ENTITY_NAME)
  create(
    @Body() dto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.serviceCategoriesService.create(dto);
  }

  @Roles(Role.Admin)
  @Patch(':id')
  @ResponseMessage('Service category updated')
  @ApiUpdate(ServiceCategoryResponseDto, ENTITY_NAME)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    return this.serviceCategoriesService.update(id, dto);
  }

  @Roles(Role.Admin)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Service category deleted')
  @ApiDelete(ENTITY_NAME)
  delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.serviceCategoriesService.delete(id);
  }
}
