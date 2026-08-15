import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiGetOne,
} from '../../common/decorators/api-docs.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import type { SessionUser } from '../auth/auth.config';
import { ADVISOR_MESSAGES } from './advisors.constants';
import { AdvisorOwnProfileResponseDto } from './dtos/advisor-own-profile-response.dto';
import { CreateAdvisorProfileDto } from './dtos/create-advisor-profile.dto';
import { AdvisorsService } from './advisors.service';

@ApiTags('Advisors')
@Controller('api/v1/advisors')
export class AdvisorsController {
  constructor(private readonly advisorsService: AdvisorsService) {}

  @Roles(Role.Advisee)
  @Post('me')
  @ResponseMessage(ADVISOR_MESSAGES.created)
  @ApiCreate(AdvisorOwnProfileResponseDto, 'Advisor profile')
  @ApiConflictResponse({ description: ADVISOR_MESSAGES.alreadyExists })
  upgrade(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateAdvisorProfileDto,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.upgrade(user, dto);
  }

  @Roles(Role.Advisor)
  @Get('me')
  @ApiGetOne(AdvisorOwnProfileResponseDto, 'Advisor profile')
  getMe(
    @CurrentUser() user: SessionUser,
  ): Promise<AdvisorOwnProfileResponseDto> {
    return this.advisorsService.getMe(user);
  }
}
