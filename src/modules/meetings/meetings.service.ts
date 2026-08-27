import { Injectable } from '@nestjs/common';
import { SessionUser } from '@/modules/auth/auth.config';
import { StaticConfigService } from '@/config/static/static.service';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly staticConfig: StaticConfigService,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  getMeetingTokenPayload(user: SessionUser, room: string) {
    return {
      ...this.staticConfig.config.meetings.jwt.primitive,
      sub: this.config.get<string>(ENV_KEYS.MEETINGS_JITSI_DOMAIN, {
        infer: true,
      }),
      room: room,
      context: {
        user: {
          avatar: user.avatarKey,
          name: user.fullName,
          email: user.email,
        },
      },
    };
  }

  async getMeetingToken(user: SessionUser, room: string) {
    const meetingEndTime = new Date(new Date().valueOf() + 60 * 60);
    const payload = this.getMeetingTokenPayload(user, room);

    const token = await this.jwtService.signAsync(payload, {
      notBefore:
        meetingEndTime.valueOf() +
        this.staticConfig.config.meetings.jwt.tokenExpiryGraceMs,
    });
    return token;
  }
}
