import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { CaseContextService } from './case-context.service';
import { CaseContextResponseDto } from './dtos/case-context-response.dto';

/**
 * The evidence routes beside the two moderation queues. Each sits under its queue's
 * path and its queue's read permission: reading a case's conversation is part of
 * reading the case.
 */
@ApiTags('Admin moderation evidence')
@Controller('admin')
export class AdminCaseContextController {
  constructor(private readonly context: CaseContextService) {}

  @UserHasPermission({ permission: { report: ['read'] } })
  @Get('reports/:reportId/context')
  @ApiGetOne(CaseContextResponseDto, { name: 'Report context' })
  forReport(
    @Param('reportId', ParseUUIDPipe) reportId: string,
  ): Promise<CaseContextResponseDto> {
    return this.context.forReport(reportId);
  }

  @UserHasPermission({ permission: { offPlatformFlag: ['read'] } })
  @Get('off-platform-flags/:flagId/context')
  @ApiGetOne(CaseContextResponseDto, { name: 'Off-platform flag context' })
  forFlag(
    @Param('flagId', ParseUUIDPipe) flagId: string,
  ): Promise<CaseContextResponseDto> {
    return this.context.forFlag(flagId);
  }
}
