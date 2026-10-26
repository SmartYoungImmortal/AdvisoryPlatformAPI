import { ApiProperty } from '@nestjs/swagger';

export class PushPublicKeyResponseDto {
  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'VAPID public key to subscribe with; null when push is not configured on this server',
  })
  publicKey: string | null;

  constructor(publicKey: string | null) {
    this.publicKey = publicKey;
  }
}

export interface PushSubscriptionView {
  id: string;
  endpoint: string;
  createdAt: Date;
}

/** A whitelist of a stored subscription: never the keys. */
export class PushSubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() endpoint: string;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;

  constructor(subscription: PushSubscriptionView) {
    this.id = subscription.id;
    this.endpoint = subscription.endpoint;
    this.createdAt = subscription.createdAt;
  }
}
