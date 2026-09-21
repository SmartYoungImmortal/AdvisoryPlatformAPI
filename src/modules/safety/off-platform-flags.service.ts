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
import { AdminProfilesRepository } from './admin-profiles.repository';
import { OffPlatformFlagsRepository } from './off-platform-flags.repository';
import {
  FLAG_CONFIRMED_STATUS,
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
      return new OffPlatformFlagResponseDto(reviewed);
    }

    // Nothing was updated: the flag is either absent or no longer pending review.
    const current = await this.flags.findById(flagId);
    if (!current) {
      throw new NotFoundException(OFF_PLATFORM_FLAG_MESSAGES.notFound);
    }
    throw new ConflictException(OFF_PLATFORM_FLAG_MESSAGES.alreadyReviewed);
  }
}
