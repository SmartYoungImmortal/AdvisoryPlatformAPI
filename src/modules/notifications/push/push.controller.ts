import { Body, Controller, Delete, Get, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiCreate,
  ApiDelete,
  ApiGetOne,
} from '@/common/decorators/api-docs.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import type { SessionUser } from '@/modules/auth/auth.config';
import {
  PushPublicKeyResponseDto,
  PushSubscriptionResponseDto,
} from './dtos/push-responses.dto';
import { SubscribePushDto } from './dtos/subscribe-push.dto';
import { UnsubscribePushDto } from './dtos/unsubscribe-push.dto';
import { PUSH_MESSAGES } from './push.constants';
import { PushService } from './push.service';

/** Device (Web Push) subscriptions of the signed-in user. */
@ApiTags('Notifications')
@Controller('notifications/push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Get('public-key')
  @ResponseMessage(PUSH_MESSAGES.publicKeyFound)
  @ApiGetOne(PushPublicKeyResponseDto, { name: 'Push public key' })
  getPublicKey(): PushPublicKeyResponseDto {
    return this.push.getPublicKey();
  }

  @Post('subscriptions')
  @ResponseMessage(PUSH_MESSAGES.subscribed)
  @ApiCreate(PushSubscriptionResponseDto, { name: 'Push subscription' })
  subscribe(
    @CurrentUser() user: SessionUser,
    @Body() dto: SubscribePushDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<PushSubscriptionResponseDto> {
    return this.push.subscribe(user.id, dto, userAgent);
  }

  @Delete('subscriptions')
  @ResponseMessage(PUSH_MESSAGES.unsubscribed)
  @ApiDelete(PushSubscriptionResponseDto, { name: 'Push subscription' })
  unsubscribe(
    @CurrentUser() user: SessionUser,
    @Body() dto: UnsubscribePushDto,
  ): Promise<PushSubscriptionResponseDto> {
    return this.push.unsubscribe(user.id, dto.endpoint);
  }
}
