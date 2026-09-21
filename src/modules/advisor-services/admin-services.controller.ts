import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiGetPaginated } from '@/common/decorators/api-docs.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import { AdvisorServiceResponseDto } from './dtos/advisor-service-response.dto';
import { AdvisorServicesService } from './advisor-services.service';

@ApiTags('Admin services')
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly services: AdvisorServicesService) {}

  @UserHasPermission({ permission: { advisorService: ['read'] } })
  @Get()
  @ApiGetPaginated(AdvisorServiceResponseDto, { name: 'Service' })
  findMany(
    @Query() query: AdvisorServiceQueryDto,
  ): Promise<PaginatedResult<AdvisorServiceResponseDto>> {
    return this.services.findManyForAdmin(query);
  }
}
