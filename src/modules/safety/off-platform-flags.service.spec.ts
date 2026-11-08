import type { NotificationsService } from '@/modules/notifications/notifications.service';
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
      | 'findManyForAdmin'
      | 'countForAdmin'
      | 'reviewIfPending'
      | 'findById'
      | 'findMessageSenderId'
    >
  >;
  let admins: jest.Mocked<Pick<AdminProfilesRepository, 'exists'>>;
  let notifications: jest.Mocked<Pick<NotificationsService, 'notify'>>;

  beforeEach(() => {
    flags = {
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      reviewIfPending: jest.fn(),
      findById: jest.fn(),
      findMessageSenderId: jest.fn().mockResolvedValue('sender-1'),
    };
    admins = { exists: jest.fn() };
    notifications = { notify: jest.fn().mockResolvedValue(undefined) };
    service = new OffPlatformFlagsService(
      flags as unknown as OffPlatformFlagsRepository,
      admins as unknown as AdminProfilesRepository,
      notifications as unknown as NotificationsService,
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
    expect(notifications.notify).toHaveBeenCalledWith({
      ownerId: 'sender-1',
      type: 'POLICY_WARNING',
      title: 'คำเตือนจากทีมงาน Advisory',
      content: 'ข้อความของคุณชวนติดต่อกันนอก Advisory จึงได้รับ 3 คะแนนโทษ',
      en: {
        title: 'A warning from the Advisory team',
        content:
          'Your message asked to continue outside Advisory, so 3 penalty points were added.',
      },
    });
  });

  it('warns no one when a flag is dismissed', async () => {
    admins.exists.mockResolvedValue(true);
    flags.reviewIfPending.mockResolvedValue(
      makeFlag({ status: 'DISMISSED', reviewedByAdminId: admin.id }),
    );

    await service.resolve(admin, flagId, { outcome: 'DISMISSED' });

    expect(notifications.notify).not.toHaveBeenCalled();
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
