import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiCreate, ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { ServiceTrialResponseDto } from './dtos/service-trial-response.dto';
import { TrialRequestResponseDto } from './dtos/trial-request-response.dto';
import { TRIAL_MESSAGES } from './trials.constants';
import { TrialsService } from './trials.service';

/** Advisee routes: a Service's free trial and your request for it. */
@ApiTags('Free trial')
@Controller('services/:serviceId')
export class TrialsController {
  constructor(private readonly trials: TrialsService) {}

  @Get('trial')
  @ResponseMessage(TRIAL_MESSAGES.trialFound)
  @ApiGetOne(ServiceTrialResponseDto, { name: 'Service free trial' })
  findForService(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<ServiceTrialResponseDto> {
    return this.trials.findForService(user, serviceId);
  }

  @Post('trial-requests')
  @ResponseMessage(TRIAL_MESSAGES.requested)
  @ApiCreate(TrialRequestResponseDto, { name: 'Trial request' })
  request(
    @CurrentUser() user: SessionUser,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<TrialRequestResponseDto> {
    return this.trials.request(user, serviceId);
  }
}
