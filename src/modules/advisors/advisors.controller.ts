import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiGetOne,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorOwnProfileResponseDto } from './dtos/advisor-own-profile-response.dto';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { UpdateAdvisorProfileDto } from './dtos/update-advisor-profile.dto';
import { AdvisorsService } from './advisors.service';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';

/**
 * The caller's own Advisor profile, which is also their application: it exists from
 * the moment they apply, while the Advisor role waits for an admin to verify their
 * identity. So these routes are held by every Advisee, not only by Advisors.
 */
@ApiTags('Advisors')
@Controller('advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @UserHasPermission({
    permission: {
      advisorApplication: ['submitSelf'],
    },
  })
  @Post('me')
  @ResponseMessage(ADVISOR_MESSAGES.created)
  @ApiCreate(AdvisorOwnProfileResponseDto, { name: 'Advisor application' })
  @ApiConflictResponse({ description: ADVISOR_MESSAGES.alreadyExists })
  apply(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.apply(user, dto);
  }

  @UserHasPermission({
    permission: {
      advisorApplication: ['readSelf'],
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
      advisorApplication: ['updateSelf'],
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
