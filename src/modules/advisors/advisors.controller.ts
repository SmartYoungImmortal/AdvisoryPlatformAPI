import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiGetOne,
  ApiUpdate,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Role, Roles } from '@/common/decorators/roles.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorOwnProfileResponseDto } from './dtos/advisor-own-profile-response.dto';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { UpdateAdvisorProfileDto } from './dtos/update-advisor-profile.dto';
import { AdvisorsService } from './advisors.service';

@ApiTags('Advisors')
@Controller('api/v1/advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @Roles(Role.Advisee)
  @Post('me')
  @ResponseMessage(ADVISOR_MESSAGES.created)
  @ApiCreate(AdvisorOwnProfileResponseDto, { name: 'Advisor profile' })
  @ApiConflictResponse({ description: ADVISOR_MESSAGES.alreadyExists })
  upgrade(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.upgrade(user, dto);
  }

  @Roles(Role.Advisor)
  @Get('me')
  @ApiGetOne(AdvisorOwnProfileResponseDto, { name: 'Advisor profile' })
  getMe(
    @CurrentUser() user: SessionUser,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.getMe(user);
  }

  @Roles(Role.Advisor)
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
