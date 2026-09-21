import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetOne,
  ApiGetPaginated,
} from '@/common/decorators/api-docs.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import { PublicServiceQueryDto } from './dtos/public-service-query.dto';
import { PublicServiceResponseDto } from './dtos/public-service-response.dto';
import { AdvisorServicesService } from './advisor-services.service';

@ApiTags('Public services')
@Public()
@Controller('services')
export class PublicServicesController {
  constructor(private readonly services: AdvisorServicesService) {}

  @Get()
  @ApiGetPaginated(PublicServiceResponseDto, {
    name: 'Published service',
    public: true,
  })
  findMany(
    @Query() query: PublicServiceQueryDto,
  ): Promise<PaginatedResult<PublicServiceResponseDto>> {
    return this.services.findPublished(query);
  }

  @Get(':serviceId')
  @ApiGetOne(PublicServiceResponseDto, {
    name: 'Published service',
    public: true,
  })
  findOne(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<PublicServiceResponseDto> {
    return this.services.findPublishedById(serviceId);
  }
}
