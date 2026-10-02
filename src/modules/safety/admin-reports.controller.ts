import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiGetOne,
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ReportsService } from './reports.service';
import { REPORT_MESSAGES } from './safety.constants';
import { AdminReportResponseDto } from './dtos/admin-report-response.dto';
import { ReportQueryDto } from './dtos/report-query.dto';
import { ResolveReportDto } from './dtos/resolve-report.dto';

@ApiTags('Admin reports')
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @UserHasPermission({ permission: { report: ['read'] } })
  @Get()
  @ApiGetPaginated(AdminReportResponseDto, { name: 'Report' })
  findMany(
    @Query() query: ReportQueryDto,
  ): Promise<PaginatedResult<AdminReportResponseDto>> {
    return this.reports.findManyForAdmin(query);
  }

  @UserHasPermission({ permission: { report: ['read'] } })
  @Get(':reportId')
  @ApiGetOne(AdminReportResponseDto, { name: 'Report' })
  findOne(
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<AdminReportResponseDto> {
    return this.reports.findOneForAdmin(reportId);
  }

  @UserHasPermission({ permission: { report: ['decide'] } })
  @Post(':reportId/resolve')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(REPORT_MESSAGES.resolved)
  @ApiUpdate(AdminReportResponseDto, { name: 'Report' })
  resolve(
    @CurrentUser() admin: SessionUser,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: ResolveReportDto,
  ): Promise<AdminReportResponseDto> {
    return this.reports.resolve(admin, reportId, dto);
  }
}
