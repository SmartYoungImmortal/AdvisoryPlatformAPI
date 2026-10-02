import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import {
  ApiCreate,
  ApiGetPaginated,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { OffsetPaginationDto } from '@/common/pagination/offset-pagination.dto';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ReportsService } from './reports.service';
import { REPORT_MESSAGES } from './safety.constants';
import { CreateReportDto } from './dtos/create-report.dto';
import { OwnReportResponseDto } from './dtos/own-report-response.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @UserHasPermission({ permission: { report: ['submitSelf'] } })
  @Post()
  @ResponseMessage(REPORT_MESSAGES.submitted)
  @ApiCreate(OwnReportResponseDto, { name: 'Report' })
  submit(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateReportDto,
  ): Promise<OwnReportResponseDto> {
    return this.reports.submit(user, dto);
  }

  @UserHasPermission({ permission: { report: ['readSelf'] } })
  @Get('me')
  @ApiGetPaginated(OwnReportResponseDto, { name: 'Own report' })
  findMine(
    @CurrentUser() user: SessionUser,
    @Query() query: OffsetPaginationDto,
  ): Promise<PaginatedResult<OwnReportResponseDto>> {
    return this.reports.findMine(user, query);
  }
}
