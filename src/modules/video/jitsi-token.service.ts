import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';

export interface JitsiTokenInput {
  roomName: string;
  userId: string;
  displayName: string;
  notBefore: Date;
  expiresAt: Date;
}

@Injectable()
export class JitsiTokenService {
  readonly domain: string;
  private readonly appId: string;
  private readonly secret: Uint8Array;

  constructor(config: ConfigService<Env, true>) {
    this.domain = config.get(ENV_KEYS.JITSI_DOMAIN, { infer: true });
    this.appId = config.get(ENV_KEYS.JITSI_APP_ID, { infer: true });
    this.secret = new TextEncoder().encode(
      config.get(ENV_KEYS.JITSI_APP_SECRET, { infer: true }),
    );
  }

  async signAccessToken(input: JitsiTokenInput): Promise<string> {
    const { SignJWT } = await import('jose');

    return new SignJWT({
      room: input.roomName,
      context: {
        user: {
          id: input.userId,
          name: input.displayName,
        },
      },
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setAudience(this.appId)
      .setIssuer(this.appId)
      .setSubject(this.domain)
      .setIssuedAt()
      .setNotBefore(Math.floor(input.notBefore.getTime() / 1_000))
      .setExpirationTime(Math.floor(input.expiresAt.getTime() / 1_000))
      .setJti(crypto.randomUUID())
      .sign(this.secret);
  }
}
