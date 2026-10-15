import { ApiProperty } from '@nestjs/swagger';
import type { InferSelectModel } from 'drizzle-orm';
import { offPlatformFlagStatusEnum, offPlatformFlags } from '@/database/schema';

type OffPlatformFlag = InferSelectModel<typeof offPlatformFlags>;

/**
 * One off-platform flag, as the moderation console sees it.
 *
 * Every column of `off_platform_flags` is here, and nothing from anywhere else: the flagged
 * message is referenced by `messageId` only. The message body, the room and the sender's
 * account are a separate read the console makes deliberately — a moderation list is not a
 * place to bulk-expose private chat content.
 */
export class OffPlatformFlagResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) messageId: string;
  @ApiProperty() matchedPattern: string;
  @ApiProperty({ enum: offPlatformFlagStatusEnum.enumValues })
  status: OffPlatformFlag['status'];
  @ApiProperty({ format: 'uuid', nullable: true, type: String })
  reviewedByAdminId: string | null;
  @ApiProperty({ minimum: 0 }) penaltyPointsApplied: number;
  @ApiProperty({ format: 'date-time' }) createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  reviewedAt: Date | null;

  constructor(flag: OffPlatformFlag) {
    this.id = flag.id;
    this.messageId = flag.messageId;
    this.matchedPattern = flag.matchedPattern;
    this.status = flag.status;
    this.reviewedByAdminId = flag.reviewedByAdminId;
    this.penaltyPointsApplied = flag.penaltyPointsApplied;
    this.createdAt = flag.createdAt;
    this.reviewedAt = flag.reviewedAt;
  }
}
