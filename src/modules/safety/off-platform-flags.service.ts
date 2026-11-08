import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  paginateQuery,
  type PaginatedResult,
} from '@/common/pagination/offset-pagination.dto';
import type { SessionUser } from '@/modules/auth/auth.config';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { AdminProfilesRepository } from './admin-profiles.repository';
import { OffPlatformFlagsRepository } from './off-platform-flags.repository';
import {
  FLAG_CONFIRMED_STATUS,
  POLICY_WARNING_NOTIFICATION,
  OFF_PLATFORM_FLAG_MESSAGES,
  SAFETY_MESSAGES,
} from './safety.constants';
import { OffPlatformFlagQueryDto } from './dtos/off-platform-flag-query.dto';
import { OffPlatformFlagResponseDto } from './dtos/off-platform-flag-response.dto';
import { ResolveOffPlatformFlagDto } from './dtos/resolve-off-platform-flag.dto';

@Injectable()
export class OffPlatformFlagsService {
  constructor(
    private readonly flags: OffPlatformFlagsRepository,
    private readonly admins: AdminProfilesRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async findMany(
    query: OffPlatformFlagQueryDto,
  ): Promise<PaginatedResult<OffPlatformFlagResponseDto>> {
    return paginateQuery(
      query,
      (options) => this.flags.findManyForAdmin(query.status, options),
      () => this.flags.countForAdmin(query.status),
      (flag) => new OffPlatformFlagResponseDto(flag),
    );
  }

  /**
   * The ruling on a flagged message, and the penalty that goes with it.
   *
   * Points on a dismissal are refused rather than stored as a contradiction, and a flag
   * already reviewed is a 409: the first admin's decision and their point total stand.
   */
  async resolve(
    admin: SessionUser,
    flagId: string,
    dto: ResolveOffPlatformFlagDto,
  ): Promise<OffPlatformFlagResponseDto> {
    if (
      dto.outcome !== FLAG_CONFIRMED_STATUS &&
      dto.penaltyPointsApplied !== undefined &&
      dto.penaltyPointsApplied > 0
    ) {
      throw new BadRequestException(
        OFF_PLATFORM_FLAG_MESSAGES.penaltyRequiresConfirmation,
      );
    }

    if (!(await this.admins.exists(admin.id))) {
      throw new ForbiddenException(SAFETY_MESSAGES.adminProfileRequired);
    }

    const reviewed = await this.flags.reviewIfPending(flagId, {
      status: dto.outcome,
      reviewedByAdminId: admin.id,
      penaltyPointsApplied: dto.penaltyPointsApplied ?? 0,
      reviewedAt: new Date(),
    });
    if (reviewed) {
      if (reviewed.status === FLAG_CONFIRMED_STATUS) {
        await this.warnSender(
          reviewed.messageId,
          reviewed.penaltyPointsApplied ?? 0,
        );
      }
      return new OffPlatformFlagResponseDto(reviewed);
    }

    // Nothing was updated: the flag is either absent or no longer pending review.
    const current = await this.flags.findById(flagId);
    if (!current) {
      throw new NotFoundException(OFF_PLATFORM_FLAG_MESSAGES.notFound);
    }
    throw new ConflictException(OFF_PLATFORM_FLAG_MESSAGES.alreadyReviewed);
  }

  /**
   * Warns whoever sent a confirmed message. Only the admin whose ruling was written gets here, so it
   * is sent once. A failure must not undo the ruling.
   */
  private async warnSender(messageId: string, points: number): Promise<void> {
    try {
      const senderId = await this.flags.findMessageSenderId(messageId);
      if (!senderId) return;
      await this.notifications.notify({
        ownerId: senderId,
        type: 'POLICY_WARNING',
        title: POLICY_WARNING_NOTIFICATION.title,
        content: POLICY_WARNING_NOTIFICATION.content(points),
        en: {
          title: POLICY_WARNING_NOTIFICATION.en.title,
          content: POLICY_WARNING_NOTIFICATION.en.content(points),
        },
      });
    } catch {
      // The ruling stands; the admin can see it in the queue.
    }
  }
}
