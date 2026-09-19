import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AdminAccountsRepository } from './admin-accounts.repository';
import { AdminAccountsService } from './admin-accounts.service';
import type {
  AdminAccountDetailRow,
  AdminAccountRow,
} from './admin-accounts.types';
import { AccountQueryDto } from './dtos/account-query.dto';

const admin = { id: '99999999-9999-9999-9999-999999999999' } as SessionUser;
const userId = '11111111-1111-1111-1111-111111111111';

function makeAccount(
  overrides: Partial<AdminAccountRow> = {},
): AdminAccountRow {
  return {
    id: userId,
    displayName: 'Nam',
    email: 'nam@example.com',
    emailVerified: true,
    fullName: 'Nam Example',
    avatarKey: null,
    timezone: 'Asia/Bangkok',
    status: 'ACTIVE',
    role: 'advisee',
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-01T00:00:00Z'),
    ...overrides,
  };
}

function makeDetail(
  overrides: Partial<AdminAccountDetailRow> = {},
): AdminAccountDetailRow {
  return { ...makeAccount(), advisorProfileUserId: null, ...overrides };
}

describe('AdminAccountsService', () => {
  let service: AdminAccountsService;
  let accounts: jest.Mocked<
    Pick<
      AdminAccountsRepository,
      | 'findManyForAdmin'
      | 'countForAdmin'
      | 'findDetailById'
      | 'suspendIfActive'
      | 'reinstateIfSuspended'
      | 'findStatusById'
    >
  >;

  beforeEach(() => {
    accounts = {
      findManyForAdmin: jest.fn(),
      countForAdmin: jest.fn(),
      findDetailById: jest.fn(),
      suspendIfActive: jest.fn(),
      reinstateIfSuspended: jest.fn(),
      findStatusById: jest.fn(),
    };
    service = new AdminAccountsService(
      accounts as unknown as AdminAccountsRepository,
    );
  });

  it('passes every filter to both the page and its count', async () => {
    accounts.findManyForAdmin.mockResolvedValue([makeAccount()]);
    accounts.countForAdmin.mockResolvedValue(1);
    const query = Object.assign(new AccountQueryDto(), {
      page: 1,
      limit: 20,
      status: 'ACTIVE' as const,
      role: 'advisee' as const,
      q: 'nam',
    });

    await expect(service.findMany(query)).resolves.toEqual({
      items: [expect.objectContaining({ id: userId })],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(accounts.findManyForAdmin).toHaveBeenCalledWith(query, {
      limit: 20,
      offset: 0,
    });
    expect(accounts.countForAdmin).toHaveBeenCalledWith(query);
  });

  it('answers the detail route with whether an advisor profile exists', async () => {
    accounts.findDetailById.mockResolvedValue(
      makeDetail({ advisorProfileUserId: userId }),
    );

    await expect(service.findOne(userId)).resolves.toEqual(
      expect.objectContaining({ hasAdvisorProfile: true }),
    );
  });

  it('says an account has no advisor profile when the join found none', async () => {
    accounts.findDetailById.mockResolvedValue(makeDetail());

    await expect(service.findOne(userId)).resolves.toEqual(
      expect.objectContaining({ hasAdvisorProfile: false }),
    );
  });

  it('404s an account that is not there', async () => {
    accounts.findDetailById.mockResolvedValue(undefined);

    await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
  });

  it('never lets an admin suspend their own account', async () => {
    await expect(
      service.suspend(admin, admin.id, { reason: 'Testing' }),
    ).rejects.toThrow(BadRequestException);
    expect(accounts.suspendIfActive).not.toHaveBeenCalled();
  });

  it('writes the status and the ban together, with the given reason', async () => {
    accounts.suspendIfActive.mockResolvedValue(
      makeAccount({
        status: 'SUSPENDED',
        banned: true,
        banReason: 'Off-platform solicitation',
      }),
    );

    await expect(
      service.suspend(admin, userId, { reason: 'Off-platform solicitation' }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'SUSPENDED',
        banned: true,
        banReason: 'Off-platform solicitation',
      }),
    );
    expect(accounts.suspendIfActive).toHaveBeenCalledWith(
      userId,
      'Off-platform solicitation',
    );
  });

  it('rejects suspending an account that is already suspended', async () => {
    accounts.suspendIfActive.mockResolvedValue(undefined);
    accounts.findStatusById.mockResolvedValue('SUSPENDED');

    await expect(
      service.suspend(admin, userId, { reason: 'Again' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects suspending an account that was deleted', async () => {
    accounts.suspendIfActive.mockResolvedValue(undefined);
    accounts.findStatusById.mockResolvedValue('DELETED');

    await expect(
      service.suspend(admin, userId, { reason: 'Too late' }),
    ).rejects.toThrow(ConflictException);
  });

  it('404s a suspension of an account that is not there', async () => {
    accounts.suspendIfActive.mockResolvedValue(undefined);
    accounts.findStatusById.mockResolvedValue(undefined);

    await expect(
      service.suspend(admin, userId, { reason: 'Nobody' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('clears the whole suspension on reinstatement', async () => {
    accounts.reinstateIfSuspended.mockResolvedValue(makeAccount());

    await expect(service.reinstate(userId)).resolves.toEqual(
      expect.objectContaining({
        status: 'ACTIVE',
        banned: false,
        banReason: null,
        banExpires: null,
      }),
    );
  });

  it('rejects reinstating an account that is not suspended', async () => {
    accounts.reinstateIfSuspended.mockResolvedValue(undefined);
    accounts.findStatusById.mockResolvedValue('ACTIVE');

    await expect(service.reinstate(userId)).rejects.toThrow(ConflictException);
  });

  it('rejects reinstating an account that was deleted', async () => {
    accounts.reinstateIfSuspended.mockResolvedValue(undefined);
    accounts.findStatusById.mockResolvedValue('DELETED');

    await expect(service.reinstate(userId)).rejects.toThrow(ConflictException);
  });

  it('404s a reinstatement of an account that is not there', async () => {
    accounts.reinstateIfSuspended.mockResolvedValue(undefined);
    accounts.findStatusById.mockResolvedValue(undefined);

    await expect(service.reinstate(userId)).rejects.toThrow(NotFoundException);
  });

  it('reads a null `banned` column as not banned', async () => {
    accounts.findDetailById.mockResolvedValue(makeDetail({ banned: null }));

    await expect(service.findOne(userId)).resolves.toEqual(
      expect.objectContaining({ banned: false }),
    );
  });
});
