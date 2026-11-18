import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserHasPermission } from '@thallesp/nestjs-better-auth';
import { ApiUpdate } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { DeclineTrialRequestDto } from './dtos/decline-trial-request.dto';
import { TrialRequestResponseDto } from './dtos/trial-request-response.dto';
import { TRIAL_MESSAGES } from './trials.constants';
import { TrialsService } from './trials.service';

/**
 * Advisor routes: grant or decline a free-trial request, from its card in the chat room. The
 * service checks ownership, so another Advisor's request returns 404.
 */
@ApiTags('Free trial')
@Controller('advisors/me/trial-requests')
export class AdvisorTrialsController {
  constructor(private readonly trials: TrialsService) {}

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post(':requestId/grant')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(TRIAL_MESSAGES.granted)
  @ApiUpdate(TrialRequestResponseDto, { name: 'Trial request' })
  grant(
    @CurrentUser() user: SessionUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
  ): Promise<TrialRequestResponseDto> {
    return this.trials.grant(user, requestId);
  }

  @UserHasPermission({ permission: { advisor: ['updateSelf'] } })
  @Post(':requestId/decline')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage(TRIAL_MESSAGES.declined)
  @ApiUpdate(TrialRequestResponseDto, { name: 'Trial request' })
  decline(
    @CurrentUser() user: SessionUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() dto: DeclineTrialRequestDto,
  ): Promise<TrialRequestResponseDto> {
    return this.trials.decline(user, requestId, dto);
  }
}
