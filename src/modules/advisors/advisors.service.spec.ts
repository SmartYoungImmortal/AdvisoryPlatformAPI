import { ConflictException, NotFoundException } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { advisorProfiles } from '@/database/schema';
import type { SessionUser } from '@/modules/auth/auth.config';
import type { AdvisorsRepository } from './advisors.repository';
import { AdvisorsService } from './advisors.service';

type AdvisorProfile = InferSelectModel<typeof advisorProfiles>;

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'advisor@example.test',
  name: 'Advisor',
  fullName: 'Advisor Example',
  timezone: 'Asia/Bangkok',
  status: 'ACTIVE',
  emailVerified: false,
  image: null,
  avatarKey: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
} satisfies SessionUser;

function profile(): AdvisorProfile {
  return {
    userId: user.id,
    headline: 'Operations advisor',
    bio: null,
    penaltyPoints: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    modifiedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

describe('AdvisorsService', () => {
  let repository: jest.Mocked<
    Pick<
      AdvisorsRepository,
      | 'findByUserId'
      | 'findVerificationStatus'
      | 'createIfAbsent'
      | 'updateByUserId'
    >
  >;
  let service: AdvisorsService;

  beforeEach(() => {
    repository = {
      findByUserId: jest.fn(),
      findVerificationStatus: jest.fn().mockResolvedValue('SUBMITTED'),
      createIfAbsent: jest.fn(),
      updateByUserId: jest.fn(),
    };
    service = new AdvisorsService(repository as unknown as AdvisorsRepository);
  });

  it('returns the owner-only profile DTO with the application status', async () => {
    repository.findByUserId.mockResolvedValue(profile());

    const result = await service.getMe(user);

    expect(result).toMatchObject({
      id: user.id,
      email: user.email,
      headline: 'Operations advisor',
      verificationStatus: 'SUBMITTED',
    });
    expect(repository.findVerificationStatus).toHaveBeenCalledWith(user.id);
  });

  it('throws when the advisor profile does not exist', async () => {
    repository.findByUserId.mockResolvedValue(undefined);

    await expect(service.getMe(user)).rejects.toThrow(NotFoundException);
  });

  it('opens the application once, with nothing submitted yet', async () => {
    repository.createIfAbsent.mockResolvedValue(profile());

    const result = await service.apply(user, {
      headline: 'Operations advisor',
    });

    expect(repository.createIfAbsent).toHaveBeenCalledWith(user.id, {
      headline: 'Operations advisor',
    });
    expect(result.headline).toBe('Operations advisor');
    expect(result.verificationStatus).toBe('NONE');
    expect(repository.findVerificationStatus).not.toHaveBeenCalled();
  });

  it('maps a repeated atomic application to conflict', async () => {
    repository.createIfAbsent.mockResolvedValue(undefined);

    await expect(service.apply(user, { headline: 'Again' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('updates the owner-only advisor profile and reports its status', async () => {
    repository.updateByUserId.mockResolvedValue({
      ...profile(),
      headline: 'Updated advisor',
    });

    const result = await service.updateMe(user, {
      headline: 'Updated advisor',
    });

    expect(repository.updateByUserId).toHaveBeenCalledWith(user.id, {
      headline: 'Updated advisor',
    });
    expect(result.headline).toBe('Updated advisor');
    expect(result.verificationStatus).toBe('SUBMITTED');
  });

  it('throws when updating a missing advisor profile', async () => {
    repository.updateByUserId.mockResolvedValue(undefined);

    await expect(
      service.updateMe(user, { headline: 'Missing' }),
    ).rejects.toThrow(NotFoundException);
  });
});
