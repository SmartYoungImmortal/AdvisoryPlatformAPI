import { Controller, Get, Header, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiGetOne } from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import { VideoAccessResponseDto } from './dtos/video-access-response.dto';
import { VIDEO_MESSAGES } from './video.constants';
import { VideoService } from './video.service';

@ApiTags('Video')
@Controller('api/v1/appointments')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get(':appointmentId/video-access')
  @Header('Cache-Control', 'no-store')
  @ResponseMessage(VIDEO_MESSAGES.accessGranted)
  @ApiGetOne(VideoAccessResponseDto, { name: 'Video access' })
  getAccess(
    @CurrentUser() currentUser: SessionUser,
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
  ): Promise<VideoAccessResponseDto> {
    return this.videoService.getAccess(appointmentId, currentUser);
  }
}
