import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush from 'web-push';
import { ENV_KEYS } from '@/config/env.constants';
import type { Env } from '@/config/env.schema';
import {
  PushPublicKeyResponseDto,
  PushSubscriptionResponseDto,
} from './dtos/push-responses.dto';
import type { SubscribePushDto } from './dtos/subscribe-push.dto';
import { PUSH_MESSAGES, PUSH_TTL_SECONDS } from './push.constants';
import { PushRepository } from './push.repository';

/** What the service worker receives; it shows `title`/`body` and opens `url` on tap. */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  /** Notifications with the same tag replace each other on the device. */
  tag?: string;
}

/** A push service answers 404 or 410 when the browser dropped the subscription. */
function isGone(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const status = (error as { statusCode?: unknown }).statusCode;
  return status === 404 || status === 410;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly publicKey: string | null;

  constructor(
    config: ConfigService<Env, true>,
    private readonly repository: PushRepository,
  ) {
    const publicKey = config.get(ENV_KEYS.VAPID_PUBLIC_KEY, { infer: true });
    const privateKey = config.get(ENV_KEYS.VAPID_PRIVATE_KEY, { infer: true });
    const subject = config.get(ENV_KEYS.VAPID_SUBJECT, { infer: true });

    if (publicKey && privateKey && subject) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.publicKey = publicKey;
    } else {
      this.publicKey = null;
      this.logger.warn('VAPID keys are not set; device push is switched off');
    }
  }

  getPublicKey(): PushPublicKeyResponseDto {
    return new PushPublicKeyResponseDto(this.publicKey);
  }

  async subscribe(
    userId: string,
    dto: SubscribePushDto,
    userAgent: string | undefined,
  ): Promise<PushSubscriptionResponseDto> {
    const row = await this.repository.upsert({
      userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent: userAgent?.slice(0, 512) ?? null,
    });
    return new PushSubscriptionResponseDto(row);
  }

  async unsubscribe(
    userId: string,
    endpoint: string,
  ): Promise<PushSubscriptionResponseDto> {
    const row = await this.repository.deleteForUser(userId, endpoint);
    if (!row) throw new NotFoundException(PUSH_MESSAGES.notFound);
    return new PushSubscriptionResponseDto(row);
  }

  /**
   * Sends to every device the user subscribed. It never throws: a failed push must not undo the
   * notification or the action that caused it. Subscriptions the push service reports gone are
   * deleted.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.publicKey) return;
    try {
      const subscriptions = await this.repository.findByUser(userId);
      const body = JSON.stringify(payload);
      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: { p256dh: subscription.p256dh, auth: subscription.auth },
              },
              body,
              { TTL: PUSH_TTL_SECONDS },
            );
          } catch (error: unknown) {
            if (isGone(error)) {
              await this.repository.deleteByEndpoint(subscription.endpoint);
              return;
            }
            this.logger.warn(
              `Push to a device of user ${userId} failed: ${
                error instanceof Error ? error.message : 'unknown error'
              }`,
            );
          }
        }),
      );
    } catch (error: unknown) {
      this.logger.warn(
        `Push for user ${userId} failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}
