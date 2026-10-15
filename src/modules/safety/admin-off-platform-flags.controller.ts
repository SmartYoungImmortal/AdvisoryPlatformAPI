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
  ApiGetPaginated,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { PaginatedResult } from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { OffPlatformFlagsService } from './off-platform-flags.service';
import { OFF_PLATFORM_FLAG_MESSAGES } from './safety.constants';
import { OffPlatformFlagQueryDto } from './dtos/off-platform-flag-query.dto';
import { OffPlatformFlagResponseDto } from './dtos/off-platform-flag-response.dto';
import { ResolveOffPlatformFlagDto } from './dtos/resolve-off-platform-flag.dto';

@ApiTags('Admin off-platform flags')
@Controller('admin/off-platform-flags')
export class AdminOffPlatformFlagsController {
  constructor(private readonly flags: OffPlatformFlagsService) {}

  @UserHasPermission({ permission: { offPlatformFlag: ['read'] } })
  @Get()
  @ApiGetPaginated(OffPlatformFlagResponseDto, { name: 'Off-platform flag' })
  findMany(
    @Query() query: OffPlatformFlagQueryDto,
  ): Promise<PaginatedResult<OffPlatformFlagResponseDto>> {
    return this.flags.findMany(query);
  }

  @UserHasPermission({ permission: { offPlatformFlag: ['decide'] } })
  @Post(':flagId/resolve')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(OFF_PLATFORM_FLAG_MESSAGES.resolved)
  @ApiUpdate(OffPlatformFlagResponseDto, { name: 'Off-platform flag' })
  resolve(
    @CurrentUser() admin: SessionUser,
    @Param('flagId', ParseUUIDPipe) flagId: string,
    @Body() dto: ResolveOffPlatformFlagDto,
  ): Promise<OffPlatformFlagResponseDto> {
    return this.flags.resolve(admin, flagId, dto);
  }
}
