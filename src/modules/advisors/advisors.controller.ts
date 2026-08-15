import { Body, Controller, Get, Patch, Post, Request } from '@nestjs/common';
import { ApiConflictResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiGetOne,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
// import { Role, Roles } from '@/common/decorators/roles.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorOwnProfileResponseDto } from './dtos/advisor-own-profile-response.dto';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { UpdateAdvisorProfileDto } from './dtos/update-advisor-profile.dto';
import { AdvisorsService } from './advisors.service';
import type { Request as ExpressRequest } from 'express';
import { Roles, UserHasPermission } from '@thallesp/nestjs-better-auth';

@ApiTags('Advisors')
@Controller('api/v1/advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @UserHasPermission({
    permission: {
      advisor: ['createSelf'],
    },
  })
  @Post('me')
  @ResponseMessage(ADVISOR_MESSAGES.created)
  @ApiCreate(AdvisorOwnProfileResponseDto, { name: 'Advisor profile' })
  @ApiConflictResponse({ description: ADVISOR_MESSAGES.alreadyExists })
  upgrade(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateAdvisorProfileDto,
    @Request() req: ExpressRequest,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.upgrade(user, dto, req);
  }

  @UserHasPermission({
    permission: {
      advisor: ['updateSelf'],
    },
  })
  @Get('me')
  @ApiGetOne(AdvisorOwnProfileResponseDto, { name: 'Advisor profile' })
  getMe(
    @CurrentUser() user: SessionUser,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.getMe(user);
  }

  @UserHasPermission({
    permission: {
      advisor: ['updateSelf'],
    },
  })
  @Patch('me')
  @ResponseMessage(ADVISOR_MESSAGES.updated)
  @ApiUpdate(AdvisorOwnProfileResponseDto, { name: 'Advisor profile' })
  updateMe(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.updateMe(user, dto);
  }
}
