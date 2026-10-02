import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { offPlatformFlags } from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AdminProfilesRepository } from './admin-profiles.repository';
import { OffPlatformFlagsService } from './off-platform-flags.service';
import type { OffPlatformFlagsRepository } from './off-platform-flags.repository';
import { OffPlatformFlagQueryDto } from './dtos/off-platform-flag-query.dto';

type OffPlatformFlag = InferSelectModel<typeof offPlatformFlags>;

const admin = { id: '99999999-9999-9999-9999-999999999999' } as SessionUser;
const flagId = '55555555-5555-5555-5555-555555555555';
const messageId = '66666666-6666-6666-6666-666666666666';

function makeFlag(overrides: Partial<OffPlatformFlag> = {}): OffPlatformFlag {
  return {
    id: flagId,
    messageId,
    matchedPattern: 'line id',
    status: 'PENDING_REVIEW',
    reviewedByAdminId: null,
    penaltyPointsApplied: 0,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    reviewedAt: null,
    ...overrides,
  };
}

describe('OffPlatformFlagsService', () => {
  let service: OffPlatformFlagsService;
  let flags: jest.Mocked<
    Pick<
      OffPlatformFlagsRepository,
      'findManyForAdmin' | 'countForAdmin' | 'reviewIfPending' | 'findById'
    >
  >;
  let admins: jest.Mocked<Pick<AdminProfilesRepository, 'exists'>>;

  beforeEach(() => {
    flags = {
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      reviewIfPending: jest.fn(),
      findById: jest.fn(),
    };
    admins = { exists: jest.fn() };
    service = new OffPlatformFlagsService(
      flags as unknown as OffPlatformFlagsRepository,
      admins as unknown as AdminProfilesRepository,
    );
  });

  it('passes the status filter to both the page and its count', async () => {
    flags.findManyForAdmin.mockResolvedValue([makeFlag()]);
    flags.countForAdmin.mockResolvedValue(1);
    const query = Object.assign(new OffPlatformFlagQueryDto(), {
      page: 1,
      limit: 20,
      status: 'PENDING_REVIEW' as const,
    });

    await expect(service.findMany(query)).resolves.toEqual({
      items: [expect.objectContaining({ id: flagId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(flags.findManyForAdmin).toHaveBeenCalledWith('PENDING_REVIEW', {
      limit: 20,
      offset: 0,
    });
    expect(flags.countForAdmin).toHaveBeenCalledWith('PENDING_REVIEW');
  });

  it('records the penalty on a confirmed flag', async () => {
    admins.exists.mockResolvedValue(true);
    flags.reviewIfPending.mockResolvedValue(
      makeFlag({
        status: 'CONFIRMED',
        penaltyPointsApplied: 3,
        reviewedByAdminId: admin.id,
      }),
    );

    await expect(
      service.resolve(admin, flagId, {
        outcome: 'CONFIRMED',
        penaltyPointsApplied: 3,
      }),
    ).resolves.toEqual(
      expect.objectContaining({ status: 'CONFIRMED', penaltyPointsApplied: 3 }),
    );
    expect(flags.reviewIfPending).toHaveBeenCalledWith(
      flagId,
      expect.objectContaining({
        status: 'CONFIRMED',
        penaltyPointsApplied: 3,
        reviewedByAdminId: admin.id,
      }),
    );
  });

  it('writes no points when a ruling omits them', async () => {
    admins.exists.mockResolvedValue(true);
    flags.reviewIfPending.mockResolvedValue(makeFlag({ status: 'DISMISSED' }));

    await service.resolve(admin, flagId, { outcome: 'DISMISSED' });

    expect(flags.reviewIfPending).toHaveBeenCalledWith(
      flagId,
      expect.objectContaining({ penaltyPointsApplied: 0 }),
    );
  });

  it('refuses penalty points on a dismissal', async () => {
    await expect(
      service.resolve(admin, flagId, {
        outcome: 'DISMISSED',
        penaltyPointsApplied: 2,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(flags.reviewIfPending).not.toHaveBeenCalled();
  });

  it('accepts an explicit zero penalty on a dismissal', async () => {
    admins.exists.mockResolvedValue(true);
    flags.reviewIfPending.mockResolvedValue(makeFlag({ status: 'DISMISSED' }));

    await service.resolve(admin, flagId, {
      outcome: 'DISMISSED',
      penaltyPointsApplied: 0,
    });

    expect(flags.reviewIfPending).toHaveBeenCalled();
  });

  it('refuses to rule when the admin has no admin profile row', async () => {
    admins.exists.mockResolvedValue(false);

    await expect(
      service.resolve(admin, flagId, { outcome: 'CONFIRMED' }),
    ).rejects.toThrow(ForbiddenException);
    expect(flags.reviewIfPending).not.toHaveBeenCalled();
  });

  it('rejects a second ruling on an already reviewed flag', async () => {
    admins.exists.mockResolvedValue(true);
    flags.reviewIfPending.mockResolvedValue(undefined);
    flags.findById.mockResolvedValue(
      makeFlag({ status: 'CONFIRMED', penaltyPointsApplied: 5 }),
    );

    await expect(
      service.resolve(admin, flagId, { outcome: 'DISMISSED' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rules on a flag that is not there with a 404, not a 409', async () => {
    admins.exists.mockResolvedValue(true);
    flags.reviewIfPending.mockResolvedValue(undefined);
    flags.findById.mockResolvedValue(undefined);

    await expect(
      service.resolve(admin, flagId, { outcome: 'CONFIRMED' }),
    ).rejects.toThrow(NotFoundException);
  });
});
