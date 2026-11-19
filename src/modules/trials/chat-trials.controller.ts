import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetMany } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { TrialRequestResponseDto } from './dtos/trial-request-response.dto';
import { TrialsService } from './trials.service';

/** The free-trial request cards of a chat room, for either member. Anyone else gets a 404. */
@ApiTags('Free trial')
@Controller('chat/rooms/:chatRoomId')
export class ChatTrialsController {
  constructor(private readonly trials: TrialsService) {}

  @Get('trial-requests')
  @ApiGetMany(TrialRequestResponseDto, { name: 'Trial request' })
  findForRoom(
    @CurrentUser() user: SessionUser,
    @Param('chatRoomId', ParseUUIDPipe) chatRoomId: string,
  ): Promise<TrialRequestResponseDto[]> {
    return this.trials.findForRoom(user, chatRoomId);
  }
}
