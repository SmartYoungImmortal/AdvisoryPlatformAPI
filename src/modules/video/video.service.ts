import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import { VideoAccessResponseDto } from './dtos/video-access-response.dto';
import { JitsiTokenService } from './jitsi-token.service';
import { VIDEO_MESSAGES, VIDEO_ROOM_PREFIX } from './video.constants';
import {
  type VideoAppointmentAccess,
  VideoRepository,
} from './video.repository';

const ACCESSIBLE_APPOINTMENT_STATES: ReadonlySet<
  VideoAppointmentAccess['state']
> = new Set(['BOOKED', 'IN_PROGRESS']);

@Injectable()
export class VideoService {
  private readonly accessBufferMilliseconds: number;

  constructor(
    private readonly videoRepository: VideoRepository,
    private readonly jitsiTokenService: JitsiTokenService,
    config: ConfigService<Env, true>,
  ) {
    this.accessBufferMilliseconds =
      config.get(ENV_KEYS.JITSI_ACCESS_BUFFER_MINUTES, { infer: true }) *
      60_000;
  }

  async getAccess(
    appointmentId: string,
    currentUser: SessionUser,
  ): Promise<VideoAccessResponseDto> {
    const appointment = await this.videoRepository.findForParticipant(
      appointmentId,
      currentUser.id,
    );
    const now = new Date();

    if (!appointment || !ACCESSIBLE_APPOINTMENT_STATES.has(appointment.state)) {
      throw new NotFoundException(VIDEO_MESSAGES.accessUnavailable);
    }

    const accessStartsAt = new Date(
      appointment.startTime.getTime() - this.accessBufferMilliseconds,
    );
    const accessEndsAt = new Date(
      appointment.endTime.getTime() + this.accessBufferMilliseconds,
    );

    if (now < accessStartsAt || now >= accessEndsAt) {
      throw new NotFoundException(VIDEO_MESSAGES.accessUnavailable);
    }

    const roomName =
      appointment.jitsiRoomName ??
      (await this.videoRepository.assignRoomNameIfMissing(
        appointment.id,
        `${VIDEO_ROOM_PREFIX}-${crypto.randomUUID().replaceAll('-', '')}`,
      ));

    if (!roomName) {
      throw new ServiceUnavailableException(VIDEO_MESSAGES.roomUnavailable);
    }

    const token = await this.jitsiTokenService.signAccessToken({
      roomName,
      userId: currentUser.id,
      displayName: currentUser.name,
      notBefore: accessStartsAt,
      expiresAt: accessEndsAt,
    });

    return new VideoAccessResponseDto({
      roomName,
      domain: this.jitsiTokenService.domain,
      token,
      expiresAt: accessEndsAt,
    });
  }
}
