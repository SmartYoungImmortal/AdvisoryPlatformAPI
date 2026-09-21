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
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiCreate,
  ApiDelete,
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ADVISOR_SERVICE_MESSAGES } from './advisor-services.constants';
import { AdvisorServicesService } from './advisor-services.service';
import { AdvisorServiceQueryDto } from './dtos/advisor-service-query.dto';
import { AdvisorServiceResponseDto } from './dtos/advisor-service-response.dto';
import { CreateAdvisorServiceDto } from './dtos/create-advisor-service.dto';
import { UpdateAdvisorServiceDto } from './dtos/update-advisor-service.dto';

@ApiTags('Advisor Services')
@Controller('advisors/me/services')
export class AdvisorServicesController {
  constructor(private readonly services: AdvisorServicesService) {}

  @UserHasPermission({ permission: { advisorService: ['read'] } })
  @Get()
  @ApiGetPaginated(AdvisorServiceResponseDto, { name: 'Advisor service' })
  findMany(
    @CurrentUser() user: SessionUser,
    @Query() query: AdvisorServiceQueryDto,
  ): Promise<PaginatedResult<AdvisorServiceResponseDto>> {
    return this.services.findMany(user, query);
  }

  @UserHasPermission({ permission: { advisorService: ['read'] } })
  @Get(':serviceId')
  @ApiGetOne(AdvisorServiceResponseDto, { name: 'Advisor service' })
  findOne(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<AdvisorServiceResponseDto> {
    return this.services.findOne(user, serviceId);
  }

  @UserHasPermission({ permission: { advisorService: ['createSelf'] } })
  @Post()
  @ResponseMessage(ADVISOR_SERVICE_MESSAGES.created)
  @ApiCreate(AdvisorServiceResponseDto, { name: 'Advisor service' })
  create(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateAdvisorServiceDto,
  ): Promise<AdvisorServiceResponseDto> {
    return this.services.create(user, dto);
  }

  @UserHasPermission({ permission: { advisorService: ['update'] } })
  @Patch(':serviceId')
  @ResponseMessage(ADVISOR_SERVICE_MESSAGES.updated)
  @ApiUpdate(AdvisorServiceResponseDto, { name: 'Advisor service' })
  update(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateAdvisorServiceDto,
  ): Promise<AdvisorServiceResponseDto> {
    return this.services.update(user, serviceId, dto);
  }

  @UserHasPermission({ permission: { advisorService: ['delete'] } })
  @Delete(':serviceId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(ADVISOR_SERVICE_MESSAGES.deleted)
  @ApiDelete(AdvisorServiceResponseDto, { name: 'Advisor service' })
  delete(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<AdvisorServiceResponseDto> {
    return this.services.delete(user, serviceId);
  }
}
